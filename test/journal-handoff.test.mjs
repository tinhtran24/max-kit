import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { editConfig, gitRepo, makeKb, tmpDir } from "./helpers.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "max-kit.mjs");
const mk = (cwd, args, input) => spawnSync(process.execPath, [BIN, ...args], { cwd, input, encoding: "utf8" });

test("journal create redacts, records context, and lists newest first", () => {
  const repo = gitRepo(path.join(tmpDir("journal"), "app"), "feat/totals");
  mk(repo, ["plan", "create", "--title", "Totals", "--phase", "One"]);
  const body = "## What happened\nFixed rounding. api_key=sk_live_abcdefghijklmnop1234\n\n## Next steps\nShip.\n";
  const r = mk(repo, ["journal", "create", "Rounding fix", "--summary", "Totals round half up", "--stdin", "--tag", "orders", "--json"], body);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /secrets were redacted/);
  const { file } = JSON.parse(r.stdout);
  const text = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(text, /abcdefghijklmnop1234/);
  assert.match(text, /^branch: feat\/totals$/m);
  assert.match(text, /^plan: \d{6}-\d{4}-totals$/m);
  assert.match(text, /^tags:\n {2}- orders$/m);
  assert.equal(path.dirname(file), path.join(fs.realpathSync.native(repo), "plans", "journals"));

  mk(repo, ["journal", "create", "Second entry", "--summary", "More", "--stdin"], "## Note\nok\n");
  const list = JSON.parse(mk(repo, ["journal", "list", "--json"]).stdout);
  assert.equal(list.length, 2);
  assert.match(list[0].stem, /second-entry/);
  assert.equal(JSON.parse(mk(repo, ["journal", "show", "rounding-fix", "--json"]).stdout).summary, "Totals round half up");
  assert.equal(mk(repo, ["journal", "validate"]).status, 0);
});

test("journal refuses empty bodies and validate flags bad entries", () => {
  const repo = gitRepo(path.join(tmpDir("journal2"), "app"), "main");
  assert.notEqual(mk(repo, ["journal", "create", "Empty", "--summary", "x", "--stdin"], "   ").status, 0);
  assert.notEqual(mk(repo, ["journal", "create", "No summary", "--stdin"], "## a\nb").status, 0);
  mk(repo, ["journal", "create", "Flat", "--summary", "no sections", "--stdin"], "just text");
  const v = mk(repo, ["journal", "validate"]);
  assert.equal(v.status, 1);
  assert.match(v.stderr, /needs at least one ## section/);
});

test("handoff reports repo, plan and harness state", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.repos = [{ id: "api", path: "api" }]));
  const api = gitRepo(path.join(kb, "api"), "feat/login");
  mk(api, ["plan", "create", "--title", "Login", "--phase", "Form", "--phase", "Session", "--feature", "SHOP-AUTH-001"]);
  fs.writeFileSync(path.join(api, "wip.js"), "x");
  const ffile = path.join(kb, "knowledge/harness/features/SHOP-BOOT-001.yml");
  fs.writeFileSync(ffile, fs.readFileSync(ffile, "utf8").replace("state: draft", "state: blocked\nblocker: needs a test account"));
  mk(kb, ["log", "fix", "Login redirect fixed"]);

  const f = JSON.parse(mk(api, ["handoff", "--json"]).stdout);
  assert.equal(f.repo.branch, "feat/login");
  assert.ok(f.repo.uncommitted >= 2);
  assert.ok(f.repo.uncommitted_files.includes("wip.js"));
  assert.equal(f.plan.feature, "SHOP-AUTH-001");
  assert.deepEqual(f.plan.next_phase, { number: 1, title: "Form", file: "phase-01-form.md", open_items: 1 });
  assert.deepEqual(f.knowledgebase.blocked, [{ id: "SHOP-BOOT-001", title: "Agent sessions load the boot context", blocker: "needs a test account" }]);
  assert.deepEqual(f.knowledgebase.dirty_repos, ["api"]);
  assert.match(f.knowledgebase.recent_log[0], /fix: Login redirect fixed/);

  const md = mk(api, ["handoff"]).stdout;
  assert.match(md, /^## Live state \(from mk handoff\)/);
  assert.match(md, /Next phase: 1\. Form/);
  assert.match(md, /blocked SHOP-BOOT-001 \(needs a test account\)/);
});
