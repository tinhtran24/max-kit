import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { handleHook } from "../src/cli/hook.mjs";
import { editConfig, fixture, gitRepo, makeKb, tmpDir } from "./helpers.mjs";

const decision = (out) => (out.stdout ? JSON.parse(out.stdout) : null);
const permission = (out) => decision(out)?.hookSpecificOutput?.permissionDecision ?? null;
const bash = (cwd, command) => handleHook("pre-tool", "claude", fixture("claude", "pre-tool-bash", { cwd, command }));

test("session start injects read order and team rules", async () => {
  const kb = await makeKb();
  const out = decision(await handleHook("session", "claude", fixture("claude", "session-start", { cwd: kb })));
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.equal(out.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(ctx, /knowledge\/harness\/features-index\.md/);
  assert.match(ctx, /# Team Rules/);
});

test("hooks stay silent outside a knowledgebase", async () => {
  const outside = tmpDir("outside");
  assert.equal((await bash(outside, "git push origin main")).stdout, "");
  assert.equal((await handleHook("session", "claude", fixture("claude", "session-start", { cwd: outside }))).stdout, "");
});

test("push to a protected branch is denied, task branch allowed", async () => {
  const kb = await makeKb();
  assert.equal(permission(await bash(kb, "git push origin main")), "deny");
  assert.equal(permission(await bash(kb, "git commit -m x && git push origin develop")), "deny");
  assert.equal(permission(await bash(kb, "git push --all")), "deny");
  assert.equal(permission(await bash(kb, "git push -u origin feat/x")), null);
});

test("push with no refspec uses the repo's current branch", async () => {
  const kb = await makeKb();
  const repo = gitRepo(path.join(kb, "api"), "main");
  assert.equal(permission(await bash(repo, "git push")), "deny");
  const task = gitRepo(path.join(kb, "web"), "feat/login");
  assert.equal(permission(await bash(task, "git push")), null);
});

test("edits on a deploy branch are denied", async () => {
  const kb = await makeKb();
  const repo = gitRepo(path.join(kb, "api"), "production");
  const file = path.join(repo, "README.md");
  const out = await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-edit", { cwd: repo, file }));
  assert.equal(permission(out), "deny");
  const dev = gitRepo(path.join(kb, "web"), "develop");
  const ok = await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-edit", { cwd: dev, file: path.join(dev, "README.md") }));
  assert.equal(permission(ok), null);
});

test("new hand-written migration is denied with the repo generator", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.repos = [{ id: "api", path: "api", migrationGenerator: "bin/rails generate migration <Name>" }]));
  const file = path.join(kb, "api", "db", "migrate", "20260101000000_add_total.rb");
  const out = await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-write", { cwd: kb, file }));
  assert.equal(permission(out), "deny");
  assert.match(decision(out).hookSpecificOutput.permissionDecisionReason, /bin\/rails generate migration/);

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "generated");
  const existing = await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-write", { cwd: kb, file }));
  assert.equal(permission(existing), null);
});

test("risky commands ask, extended patterns apply, safe commands pass", async () => {
  const kb = await makeKb();
  assert.equal(permission(await bash(kb, "terraform apply -auto-approve")), "ask");
  assert.equal(permission(await bash(kb, "psql -h db.production.example.com")), "ask");
  assert.equal(permission(await bash(kb, "docker compose up -d")), "ask");
  assert.equal(permission(await bash(kb, "docker compose up -d db")), null);
  assert.equal(permission(await bash(kb, "npm test")), null);
  editConfig(kb, (c) => (c.guards.riskyCommands.extend = ["\\bsidekiq\\b"]));
  assert.equal(permission(await bash(kb, "bundle exec sidekiq")), "ask");
});

test("deny wins over ask in the same command", async () => {
  const kb = await makeKb();
  assert.equal(permission(await bash(kb, "terraform apply && git push origin main")), "deny");
});

test("disabled guards do not run", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.guards.disabled = ["branch"]));
  assert.equal(permission(await bash(kb, "git push origin main")), null);
});

test("stop asks for evidence when a repo is dirty and no recent run exists", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.repos = [{ id: "api", path: "api" }]));
  const repo = gitRepo(path.join(kb, "api"), "develop");
  const stop = (active) => handleHook("stop", "claude", fixture("claude", "stop", { cwd: kb, active }));

  assert.equal((await stop(false)).stdout, "");
  fs.writeFileSync(path.join(repo, "change.txt"), "x");
  const blocked = decision(await stop(false));
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /api/);
  assert.equal((await stop(true)).stdout, "");

  fs.writeFileSync(path.join(kb, "knowledge", "harness", "runs", "2026-01-01-smoke.md"), "---\nfeatures: [SHOP-HARNESS-001]\n---\n");
  assert.equal((await stop(false)).stdout, "");
});

test("the hook command fails open on a bad payload", () => {
  const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "max-kit.mjs");
  const r = spawnSync(process.execPath, [bin, "hook", "pre-tool", "--runtime", "claude"], { input: "not json", encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /failed open/);
});
