import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadConfig } from "../src/core/config.mjs";
import { runVerify, planVerify } from "../src/core/harness/verify.mjs";
import { checkFreshness } from "../src/core/harness/freshness.mjs";
import { lintHarness } from "../src/core/harness/lint.mjs";
import { frontMatter } from "../src/core/harness/store.mjs";
import { redact } from "../src/core/redact.mjs";
import { editConfig, gitRepo, makeKb } from "./helpers.mjs";

const OK = `node -e "console.log('build ok token=abcd1234secret')"`;
const FAIL = `node -e "process.exit(3)"`;

function feature(kb, id, extra) {
  const file = path.join(kb, "knowledge", "harness", "features", `${id}.yml`);
  fs.writeFileSync(
    file,
    `# keep this comment
id: ${id}
title: "Order totals"
area: orders
priority: high
state: active
verification_level: contract
repo: api
trigger:
  type: user_request
  summary: "Totals must include tax."
behavior: >
  Order totals include tax.
${extra}
evidence: []
unknowns: []
updated_at: 2026-01-01
`
  );
  return file;
}

const commit = (dir, file, text) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), text);
  execFileSync("git", ["-C", dir, "add", "."], { stdio: "ignore" });
  execFileSync("git", ["-C", dir, "commit", "-q", "-m", file], { stdio: "ignore" });
};

async function setup(extra) {
  const kb = await makeKb();
  const cfg = editConfig(kb, (c) => (c.repos = [{ id: "api", path: "api" }]));
  const api = gitRepo(path.join(kb, "api"), "develop");
  const file = feature(kb, "SHOP-ORDER-001", extra);
  return { kb, cfg, api, file };
}

const VERIFY_OK = `acceptance:
  - id: AC1
    given: an order with taxable items
    then: the total includes tax
verification:
  mode: automated
  commands:
    - run: ${JSON.stringify(OK)}
      covers: [AC1]
  expected_result: "build ok"`;

test("passing verification records evidence and marks the feature passing", async () => {
  const { kb, cfg, api, file } = await setup(VERIFY_OK);
  const r = runVerify(cfg, "SHOP-ORDER-001");
  assert.equal(r.passed, true);
  assert.equal(r.state, "passing");
  const run = fs.readFileSync(r.runFile, "utf8");
  const meta = frontMatter(run);
  assert.equal(meta.result, "passed");
  assert.equal(meta.repo, "api");
  assert.equal(meta.commit, execFileSync("git", ["-C", api, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim());
  assert.equal(meta.dirty, false);
  assert.deepEqual(meta.covers, ["AC1"]);
  assert.match(run, /token=\[REDACTED\]/);
  assert.doesNotMatch(run, /abcd1234secret/);

  const yml = fs.readFileSync(file, "utf8");
  assert.match(yml, /^# keep this comment/);
  assert.match(yml, /state: passing/);
  assert.match(yml, /last_verified_at: \d{4}-\d{2}-\d{2}/);
  assert.match(yml, new RegExp(`- harness/runs/${path.basename(r.runFile)}`));
  assert.deepEqual(lintHarness(loadConfig(kb)).errors, []);
});

test("a second verify on the same day gets its own run file", async () => {
  const { cfg } = await setup(VERIFY_OK);
  const a = runVerify(cfg, "SHOP-ORDER-001");
  const b = runVerify(cfg, "SHOP-ORDER-001");
  assert.notEqual(a.runFile, b.runFile);
  assert.match(b.runFile, /-2\.md$/);
});

test("failing verification records a failed run and demotes passing", async () => {
  const { cfg, file } = await setup(VERIFY_OK.replace(JSON.stringify(OK), JSON.stringify(FAIL)));
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("state: active", "state: passing"));
  const r = runVerify(cfg, "SHOP-ORDER-001");
  assert.equal(r.passed, false);
  assert.equal(frontMatter(fs.readFileSync(r.runFile, "utf8")).result, "failed");
  assert.match(fs.readFileSync(file, "utf8"), /state: active/);
  assert.ok(r.notes.some((n) => /moved from passing to active/.test(n)));
});

test("open unknowns or a dirty repo keep the feature from passing", async () => {
  const { cfg, api, file } = await setup(VERIFY_OK);
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("unknowns: []", "unknowns:\n  - tax rounding rule"));
  let r = runVerify(cfg, "SHOP-ORDER-001");
  assert.equal(r.state, "active");
  assert.ok(r.notes.some((n) => /open unknown/.test(n)));

  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/unknowns:\n {2}- tax rounding rule/, "unknowns: []"));
  fs.writeFileSync(path.join(api, "wip.txt"), "x");
  r = runVerify(cfg, "SHOP-ORDER-001");
  assert.equal(r.state, "active");
  assert.equal(frontMatter(fs.readFileSync(r.runFile, "utf8")).dirty, true);
});

test("risky commands need --allow-risky; manual features cannot be verified", async () => {
  const { cfg } = await setup(VERIFY_OK.replace(JSON.stringify(OK), JSON.stringify("terraform apply -auto-approve")));
  assert.throws(() => runVerify(cfg, "SHOP-ORDER-001"), /risky pattern/);
  assert.ok(planVerify(cfg, "SHOP-ORDER-001").steps[0].risky);

  const manual = await setup(`verification:\n  mode: manual\n  protocol: "Click through checkout."\n  expected_result: "total shown"`);
  assert.throws(() => runVerify(manual.cfg, "SHOP-ORDER-001"), /no verification.commands/);
  assert.throws(() => runVerify(manual.cfg, "SHOP-NOPE-001"), /unknown feature/);
});

test("watched paths changing after the verified commit make evidence stale", async () => {
  const { kb, api, file } = await setup(VERIFY_OK);
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("repo: api", "repo: api\nwatch:\n  - src/orders/"));
  runVerify(loadConfig(kb), "SHOP-ORDER-001");
  assert.deepEqual(checkFreshness(loadConfig(kb)).warnings, []);

  commit(api, "docs/readme.md", "unrelated");
  assert.deepEqual(checkFreshness(loadConfig(kb)).warnings, []);

  commit(api, "src/orders/total.js", "changed");
  const warn = checkFreshness(loadConfig(kb));
  assert.equal(warn.warnings.length, 1);
  assert.match(warn.warnings[0], /src\/orders\/total\.js/);

  const strict = editConfig(kb, (c) => (c.harness.staleEvidence = "error"));
  assert.equal(checkFreshness(strict).errors.length, 1);
});

test("evidence naming a commit that does not exist is reported", async () => {
  const { kb, cfg } = await setup(VERIFY_OK);
  const r = runVerify(cfg, "SHOP-ORDER-001");
  fs.writeFileSync(r.runFile, fs.readFileSync(r.runFile, "utf8").replace(/commit: \S+/, "commit: deadbee"));
  assert.match(checkFreshness(loadConfig(kb)).warnings[0], /deadbee, which is not in api/);
});

test("acceptance criteria must be covered and covers must exist", async () => {
  const { kb } = await setup(`acceptance:
  - id: AC1
    then: total includes tax
  - id: AC2
    then: total rounds half up
  - id: AC2
    then: duplicate
verification:
  mode: automated
  commands:
    - run: npm test
      covers: [AC1, AC9]
  expected_result: "pass"`);
  const r = lintHarness(loadConfig(kb));
  assert.ok(r.errors.some((e) => /covers unknown acceptance id AC9/.test(e)));
  assert.ok(r.errors.some((e) => /duplicate acceptance id AC2/.test(e)));
  assert.ok(r.warnings.some((w) => /acceptance AC2 is not covered/.test(w)));
});

test("redaction covers common secret shapes", () => {
  const text = [
    "AKIAABCDEFGHIJKLMNOP",
    "ghp_" + "a".repeat(36),
    "xoxb-1234567890-abcdef",
    "sk_live_" + "a".repeat(24),
    "sk-ant-" + "b".repeat(30),
    "postgres://app:s3cretpass@db.local/app",
    "API_KEY=abc123xyz",
    '"password": "hunter22"',
    "-----BEGIN RSA PRIVATE KEY-----\nMIIE\n-----END RSA PRIVATE KEY-----"
  ].join("\n");
  const out = redact(text);
  for (const leaked of ["AKIAABCDEFGHIJKLMNOP", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "1234567890-abcdef", "s3cretpass", "abc123xyz", "hunter22", "MIIE"]) {
    assert.ok(!out.includes(leaked), `leaked ${leaked}`);
  }
  assert.equal(redact("plain build output, 3 tests passed"), "plain build output, 3 tests passed");
});
