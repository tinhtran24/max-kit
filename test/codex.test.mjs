import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import codex, { patchFiles } from "../src/adapters/codex/adapter.mjs";
import { BUILT_IN, renderTargets, validateAdapter } from "../src/adapters/registry.mjs";
import { syncKnowledgebase } from "../src/cli/sync.mjs";
import { handleHook } from "../src/cli/hook.mjs";
import { loadConfig } from "../src/core/config.mjs";
import { loadSkills } from "../src/core/model.mjs";
import { editConfig, fixture, gitRepo, makeKb } from "./helpers.mjs";

const GOLDEN = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden", "codex");
const out = (o) => (o.stdout ? JSON.parse(o.stdout) : null);
const hso = (o) => out(o)?.hookSpecificOutput ?? null;
const bash = (cwd, command) => handleHook("pre-tool", "codex", fixture("codex", "pre-tool-bash", { cwd, command }));
const patch = (cwd, text) => handleHook("pre-tool", "codex", fixture("codex", "pre-tool-patch", { cwd, patch: text }));

const addFile = (p) => `*** Begin Patch\n*** Add File: ${p}\n+x\n*** End Patch\n`;
const updateFile = (p) => `*** Begin Patch\n*** Update File: ${p}\n@@\n-a\n+b\n*** End Patch\n`;

test("patch file paths are parsed with their operation", () => {
  const text = "*** Begin Patch\n*** Add File: db/migrate/1_a.rb\n+x\n*** Update File: app/models/order.rb\n@@\n-a\n+b\n*** Delete File: tmp/old.rb\n*** Update File: a.rb\n*** Move to: b.rb\n*** End Patch";
  assert.deepEqual(patchFiles(text), [
    { path: "db/migrate/1_a.rb", op: "add" },
    { path: "app/models/order.rb", op: "update" },
    { path: "tmp/old.rb", op: "delete" },
    { path: "a.rb", op: "update" },
    { path: "b.rb", op: "add" }
  ]);
  assert.deepEqual(patchFiles(undefined), []);
});

test("codex adapter satisfies the contract and is built in", () => {
  assert.deepEqual(validateAdapter(codex, "codex"), []);
  assert.ok(BUILT_IN.includes(codex));
});

test("codex render matches golden files", () => {
  const model = { project: "shop", skills: loadSkills() };
  const files = codex.render(model);
  assert.deepEqual(files.map((f) => f.path), [".codex/hooks.json", ".agents/skills/harness/SKILL.md"]);
  for (const f of files) {
    const file = path.join(GOLDEN, f.path);
    if (process.env.UPDATE_GOLDEN) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, f.content);
    }
    assert.equal(f.content, fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"), f.path);
  }
});

test("session start returns additionalContext", async () => {
  const kb = await makeKb();
  const o = hso(await handleHook("session", "codex", fixture("codex", "session-start", { cwd: kb })));
  assert.equal(o.hookEventName, "SessionStart");
  assert.match(o.additionalContext, /# Team Rules/);
});

test("protected push is denied in the codex format", async () => {
  const kb = await makeKb();
  const o = hso(await bash(kb, "git push origin main"));
  assert.equal(o.hookEventName, "PreToolUse");
  assert.equal(o.permissionDecision, "deny");
  assert.equal(hso(await bash(kb, "git push -u origin feat/x")), null);
});

test("ask becomes deny by default because codex cannot ask", async () => {
  const kb = await makeKb();
  const o = hso(await bash(kb, "terraform apply"));
  assert.equal(o.permissionDecision, "deny");
  assert.match(o.permissionDecisionReason, /cannot ask from a hook/);
});

test("askFallback warn turns ask into context and lets the call run", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.guards.askFallback = "warn"));
  const o = hso(await bash(kb, "terraform apply"));
  assert.equal(o.permissionDecision, undefined);
  assert.match(o.additionalContext, /^max-kit warning: Safety check/);
  assert.equal(hso(await bash(kb, "git push origin main")).permissionDecision, "deny", "deny guards still deny");
});

test("apply_patch adding a migration is denied, updating one is allowed", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.repos = [{ id: "api", path: "api", migrationGenerator: "bin/rails generate migration <Name>" }]));
  const api = gitRepo(path.join(kb, "api"), "develop");
  const o = hso(await patch(api, addFile("db/migrate/20260101000000_add_total.rb")));
  assert.equal(o.permissionDecision, "deny");
  assert.match(o.permissionDecisionReason, /bin\/rails generate migration/);

  fs.mkdirSync(path.join(api, "db", "migrate"), { recursive: true });
  fs.writeFileSync(path.join(api, "db", "migrate", "1_existing.rb"), "x");
  assert.equal(hso(await patch(api, updateFile("db/migrate/1_existing.rb"))), null);
});

test("apply_patch on a deploy branch is denied", async () => {
  const kb = await makeKb();
  const api = gitRepo(path.join(kb, "api"), "production");
  assert.equal(hso(await patch(api, updateFile("README.md"))).permissionDecision, "deny");
});

test("stop blocks once in the codex format", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.repos = [{ id: "api", path: "api" }]));
  const api = gitRepo(path.join(kb, "api"), "develop");
  fs.writeFileSync(path.join(api, "change.txt"), "x");
  const o = out(await handleHook("stop", "codex", fixture("codex", "stop", { cwd: kb, active: false })));
  assert.equal(o.decision, "block");
  assert.equal((await handleHook("stop", "codex", fixture("codex", "stop", { cwd: kb, active: true }))).stdout, "");
});

test("a knowledgebase targeting claude and codex renders both and passes the check", async () => {
  const kb = await makeKb({ extra: ["--targets", "claude,codex"] });
  for (const f of ["AGENTS.md", "CLAUDE.md", ".codex/hooks.json", ".agents/skills/harness/SKILL.md"]) assert.ok(fs.existsSync(path.join(kb, f)), f);
  const hooks = JSON.parse(fs.readFileSync(path.join(kb, ".codex/hooks.json"), "utf8"));
  assert.equal(hooks.hooks.PreToolUse[0].hooks[0].command, "npx --no-install max-kit hook pre-tool --runtime codex");
  const r = await syncKnowledgebase(loadConfig(kb), { check: true });
  assert.deepEqual(r.errors, []);
  const agents = renderTargets({ ...{ project: "x", repos: [], branches: { protected: [], deploy: [] }, readOrder: ["AGENTS.md"], teamRulesPath: "t.md", teamRules: "", commands: [], skills: [] } }, [codex]);
  assert.ok(agents.files.some((f) => f.path === "AGENTS.md"), "codex reads AGENTS.md natively");
});
