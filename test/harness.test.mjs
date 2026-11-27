import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../src/core/config.mjs";
import { lintHarness } from "../src/core/harness/lint.mjs";
import { writeIndex } from "../src/core/harness/index.mjs";
import { appendLog, rollup } from "../src/core/harness/log.mjs";
import { newFeature, newRun } from "../src/core/harness/scaffold.mjs";
import { checkKnowledgebase } from "../src/cli/check.mjs";
import { makeKb } from "./helpers.mjs";

const errors = (results) => results.flatMap((r) => r.errors);

test("a fresh knowledgebase passes the full check", async () => {
  const kb = await makeKb();
  for (const f of ["AGENTS.md", "CLAUDE.md", ".gitignore", "package.json", "knowledge/harness/features-index.md", "knowledge/synthesis/recent-changes.md"]) {
    assert.ok(fs.existsSync(path.join(kb, f)), `${f} exists`);
  }
  assert.deepEqual(errors(await checkKnowledgebase(loadConfig(kb))), []);
});

test("init fills project values but keeps template placeholders", async () => {
  const kb = await makeKb();
  assert.match(fs.readFileSync(path.join(kb, "knowledge/business/index.md"), "utf8"), /^# shop business index/);
  assert.match(fs.readFileSync(path.join(kb, "knowledge/templates/feature.yml"), "utf8"), /id: \{\{id\}\}/);
  assert.match(fs.readFileSync(path.join(kb, "package.json"), "utf8"), /"max-kit": "github:tinhtran24\/max-kit"/);
});

test("passing without evidence is an error", async () => {
  const kb = await makeKb();
  const cfg = loadConfig(kb);
  const file = path.join(kb, "knowledge/harness/features/SHOP-HARNESS-001.yml");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("state: draft", "state: passing"));
  const r = lintHarness(cfg);
  assert.ok(r.errors.some((e) => /passing needs evidence/.test(e)));
  assert.ok(r.errors.some((e) => /last_verified_at/.test(e)));
});

test("blocked needs a blocker, ids must match the prefix", async () => {
  const kb = await makeKb();
  const cfg = loadConfig(kb);
  const file = path.join(kb, "knowledge/harness/features/SHOP-BOOT-001.yml");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("state: draft", "state: blocked"));
  assert.ok(lintHarness(cfg).errors.some((e) => /blocked needs a blocker/.test(e)));
  assert.throws(() => newFeature(cfg, { id: "OTHER-AUTH-001", title: "x", area: "auth" }), /does not match/);
});

test("new feature and run, then evidence makes passing valid", async () => {
  const kb = await makeKb();
  const cfg = loadConfig(kb);
  const feature = newFeature(cfg, { id: "SHOP-AUTH-001", title: 'Users "sign in"', area: "auth" });
  assert.match(fs.readFileSync(feature, "utf8"), /title: "Users \\"sign in\\""/);
  const run = newRun(cfg, { ids: ["SHOP-HARNESS-001"], slug: "check-smoke" });
  const runText = fs.readFileSync(run, "utf8").replace("result: skipped", "result: passed").replace(/commit: ".*"/, 'commit: "abc1234"');
  fs.writeFileSync(run, runText);

  const ffile = path.join(kb, "knowledge/harness/features/SHOP-HARNESS-001.yml");
  const runRel = `harness/runs/${path.basename(run)}`;
  fs.writeFileSync(
    ffile,
    fs
      .readFileSync(ffile, "utf8")
      .replace("state: draft", "state: passing")
      .replace("evidence: []", `evidence:\n  - ${runRel}`)
      .replace(/updated_at: (.*)/, "updated_at: $1\nlast_verified_at: $1")
  );
  assert.deepEqual(lintHarness(cfg).errors, []);
  assert.throws(() => newRun(cfg, { ids: ["SHOP-NOPE-001"], slug: "x" }), /unknown feature/);
});

test("stale generated index and log are detected and fixed", async () => {
  const kb = await makeKb();
  const cfg = loadConfig(kb);
  newFeature(cfg, { id: "SHOP-CART-001", title: "Cart totals", area: "cart" });
  assert.equal(writeIndex(cfg, { check: true }).errors.length, 1);
  writeIndex(cfg);
  assert.match(fs.readFileSync(path.join(kb, "knowledge/harness/features-index.md"), "utf8"), /SHOP-CART-001/);

  appendLog(cfg, "feature", "Cart totals verified");
  assert.ok(rollup(cfg, { check: true }).errors.length > 0);
  rollup(cfg);
  assert.match(fs.readFileSync(path.join(kb, "knowledge/synthesis/recent-changes.md"), "utf8"), /Cart totals verified/);
  assert.throws(() => appendLog(cfg, "nonsense", "x"), /log kind/);
});

test("broken links and edited generated files fail the check", async () => {
  const kb = await makeKb();
  fs.appendFileSync(path.join(kb, "knowledge/business/index.md"), "\nSee [missing](nowhere.md).\n");
  fs.appendFileSync(path.join(kb, "AGENTS.md"), "\nhand edit\n");
  const errs = errors(await checkKnowledgebase(loadConfig(kb)));
  assert.ok(errs.some((e) => /broken link nowhere\.md/.test(e)));
  assert.ok(errs.some((e) => /AGENTS\.md is out of date/.test(e)));
});

test("boot budget and duplicated rules fail the check", async () => {
  const kb = await makeKb();
  const rules = path.join(kb, "knowledge/synthesis/team-rules.md");
  const line = "- Always run the full integration suite before asking for any review of the change.";
  fs.appendFileSync(rules, `\n${line}\n`);
  fs.appendFileSync(path.join(kb, "knowledge/synthesis/agent-boot.md"), `\n${line}\n`);
  let errs = errors(await checkKnowledgebase(loadConfig(kb)));
  assert.ok(errs.some((e) => /rule copied/.test(e)));
  fs.appendFileSync(rules, "x".repeat(10000));
  errs = errors(await checkKnowledgebase(loadConfig(kb)));
  assert.ok(errs.some((e) => /boot context is \d+ chars/.test(e)));
});
