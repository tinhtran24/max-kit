import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { editConfig, gitRepo, makeKb, tmpDir } from "./helpers.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "max-kit.mjs");
const mk = (cwd, ...args) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8", env: { ...process.env, MK_PREFS_DIR: path.join(cwd, ".prefs-home") } });
let repo;

before(() => {
  repo = gitRepo(path.join(tmpDir("plans"), "app"), "feat/totals");
});

const planDir = () => {
  const dirs = fs.readdirSync(path.join(repo, "plans"));
  return path.join(repo, "plans", dirs[0]);
};

test("create scaffolds plan and phases, makes it current, and validates", () => {
  const r = mk(repo, "plan", "create", "--title", "Order totals", "--phase", "Schema", "--phase", "API layer", "--feature", "SHOP-ORDER-001");
  assert.equal(r.status, 0, r.stderr);
  const dir = planDir();
  assert.match(path.basename(dir), /^\d{6}-\d{4}-order-totals$/);
  assert.deepEqual(fs.readdirSync(dir).sort(), ["phase-01-schema.md", "phase-02-api-layer.md", "plan.md"]);
  const plan = fs.readFileSync(path.join(dir, "plan.md"), "utf8");
  assert.match(plan, /^feature: SHOP-ORDER-001$/m);
  assert.match(plan, /^branch: feat\/totals$/m);
  assert.match(plan, /\| 2 \| \[API layer\]\(phase-02-api-layer\.md\) \| pending \| 0\/1 \|/);
  assert.equal(mk(repo, "plan", "resolve").stdout.trim(), path.relative(repo, dir));
  assert.equal(mk(repo, "plan", "validate").status, 0);
});

test("check moves phase status and progress; the table regenerates", () => {
  const dir = planDir();
  const phase = path.join(dir, "phase-01-schema.md");
  fs.writeFileSync(phase, fs.readFileSync(phase, "utf8").replace("- [ ] First concrete step", "- [ ] Add column\n- [ ] Backfill"));
  assert.equal(mk(repo, "plan", "check", phase, "--item", "1").status, 0);
  let show = JSON.parse(mk(repo, "plan", "show", "--json").stdout);
  assert.equal(show.phases[0].meta.status, "in-progress");
  assert.deepEqual(show.progress, { done: 1, total: 3, percent: 33 });
  mk(repo, "plan", "check", phase);
  show = JSON.parse(mk(repo, "plan", "show", "--json").stdout);
  assert.equal(show.phases[0].meta.status, "completed");
  assert.match(fs.readFileSync(path.join(dir, "plan.md"), "utf8"), /\| 1 \| \[Schema\]\(phase-01-schema\.md\) \| completed \| 2\/2 \|/);
  mk(repo, "plan", "uncheck", phase, "--item", "2");
  assert.equal(JSON.parse(mk(repo, "plan", "show", "--json").stdout).phases[0].meta.status, "in-progress");
  assert.equal(mk(repo, "plan", "check", phase, "--item", "9").status, 2);
});

test("update completed warns about open items; close hides the plan from resolve", () => {
  const r = mk(repo, "plan", "update", "--status", "completed", "--linked-pr", "42");
  assert.equal(r.status, 0);
  assert.match(r.stderr, /checklist item\(s\) are still open/);
  assert.match(fs.readFileSync(path.join(planDir(), "plan.md"), "utf8"), /^linked_pr: 42$/m);
  assert.equal(mk(repo, "plan", "validate").status, 1, "completed with open items is invalid");
  mk(repo, "plan", "update", "--status", "in-progress");
  assert.equal(mk(repo, "plan", "close").status, 0);
  assert.equal(mk(repo, "plan", "resolve").status, 1);
  assert.equal(JSON.parse(mk(repo, "plan", "list", "--json").stdout).length, 0);
  assert.equal(JSON.parse(mk(repo, "plan", "list", "--all", "--json").stdout).length, 1);
});

test("resolve picks the branch's plan, reports ambiguity, and honours use", () => {
  const r2 = gitRepo(path.join(tmpDir("plans2"), "app"), "main");
  mk(r2, "plan", "create", "--title", "First", "--phase", "One");
  execFileSync("git", ["-C", r2, "checkout", "-q", "-b", "feat/two"]);
  mk(r2, "plan", "create", "--title", "Second", "--phase", "One");
  const gitDir = execFileSync("git", ["-C", r2, "rev-parse", "--absolute-git-dir"], { encoding: "utf8" }).trim();
  fs.rmSync(path.join(gitDir, "max-kit-current-plan"));
  assert.match(mk(r2, "plan", "resolve").stdout, /second/, "branch match wins without a pointer");
  execFileSync("git", ["-C", r2, "checkout", "-q", "main"]);
  mk(r2, "plan", "create", "--title", "Third", "--phase", "One");
  fs.rmSync(path.join(gitDir, "max-kit-current-plan"));
  assert.equal(mk(r2, "plan", "resolve").status, 3, "two plans on main is ambiguous");
  assert.equal(mk(r2, "plan", "use", "third").status, 0);
  assert.match(mk(r2, "plan", "resolve").stdout, /third/);
  assert.equal(mk(r2, "plan", "show", "nothing-like-this").status, 5);
});

test("validate catches broken phase files", () => {
  const r3 = gitRepo(path.join(tmpDir("plans3"), "app"), "main");
  mk(r3, "plan", "create", "--title", "Broken", "--phase", "One", "--phase", "Two");
  const dir = path.join(r3, "plans", fs.readdirSync(path.join(r3, "plans"))[0]);
  fs.renameSync(path.join(dir, "phase-02-two.md"), path.join(dir, "phase-02a-two.md"));
  const p1 = path.join(dir, "phase-01-one.md");
  fs.writeFileSync(p1, fs.readFileSync(p1, "utf8").replace(/## Verification[\s\S]*$/, "").replace("dependencies: []", "dependencies:\n  - 7"));
  const r = mk(r3, "plan", "validate", dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /phase-02a-two\.md: name must be phase-NN/);
  assert.match(r.stderr, /Verification section missing/);
  assert.match(r.stderr, /depends on unknown phase 7/);
});

test("completing a plan warns when its harness feature is not passing", async () => {
  const kb = await makeKb();
  const app = gitRepo(path.join(kb, "app"), "feat/x");
  mk(app, "plan", "create", "--title", "Linked", "--phase", "One", "--feature", "SHOP-HARNESS-001");
  const r = mk(app, "plan", "update", "--status", "completed");
  assert.match(r.stderr, /linked feature SHOP-HARNESS-001 is draft; run mk verify SHOP-HARNESS-001/);
});

test("prefs resolve merges user and project, with jq-compatible JSON", async () => {
  const kb = await makeKb();
  assert.equal(mk(kb, "prefs", "set", "journal.auto", "false", "--scope", "user").status, 0);
  assert.equal(mk(kb, "prefs", "set", "visual.antv.enabled", "true", "--scope", "user").status, 0);
  assert.equal(mk(kb, "prefs", "set", "visual.antv.enabled", "false").status, 0);
  const r = JSON.parse(mk(kb, "prefs", "resolve", "--json").stdout);
  assert.deepEqual(r.prefs, { journal: { auto: false }, visual: { antv: { enabled: false } } });
  assert.equal(mk(kb, "prefs", "get", "journal.auto").stdout.trim(), "false");
  assert.equal(mk(kb, "prefs", "get", "nope.key").status, 1);
  mk(kb, "prefs", "unset", "visual.antv.enabled");
  assert.equal(JSON.parse(mk(kb, "prefs", "resolve", "--json").stdout).prefs.visual.antv.enabled, true, "project unset falls back to user");
  assert.ok(!("prefs" in JSON.parse(fs.readFileSync(path.join(kb, "max-kit.config.json"), "utf8"))), "empty project prefs are removed");
  editConfig(kb, (c) => (c.prefs = { journal: { auto: true } }));
  assert.equal(mk(kb, "prefs", "get", "journal.auto").stdout.trim(), "true");
});
