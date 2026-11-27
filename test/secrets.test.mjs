import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { approve, pending } from "../src/secrets/grants.mjs";
import { parseDotenv, refFor } from "../src/secrets/dotenv.mjs";
import { hintFor } from "../src/secrets/vault.mjs";
import { handleHook } from "../src/cli/hook.mjs";
import { fixture, makeKb, tmpDir } from "./helpers.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "max-kit.mjs");
const MARKERS = ["CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT", "CODEX_SANDBOX", "CODEX_SANDBOX_NETWORK_DISABLED", "CODEX_THREAD_ID", "CURSOR_AGENT", "GEMINI_CLI", "MK_AGENT"];
const TOKEN = "sk_live_" + "Q7v2Lm9Xa4Rt8Kp1Zs6Wd3";
let vault;

function env(agent) {
  const e = { ...process.env, MK_VAULT_DIR: vault, MK_VAULT_BACKEND: "file", MK_PREFS_DIR: path.join(vault, "prefs") };
  for (const m of MARKERS) delete e[m];
  if (agent) e.MK_AGENT = "1";
  return e;
}

const mk = (args, { input, agent = false, cwd } = {}) => spawnSync(process.execPath, [BIN, "secrets", ...args], { input, env: env(agent), encoding: "utf8", cwd });

before(() => {
  vault = tmpDir("vault");
  process.env.MK_VAULT_DIR = vault;
  process.env.MK_VAULT_BACKEND = "file";
});

test("set reads stdin, never prints the value, and stores it encrypted", () => {
  const r = mk(["set", "SHOP_STRIPE_KEY", "--value=-", "--project", "shop", "--environment", "production", "--provider", "stripe", "--tag", "billing", "--json"], { input: `${TOKEN}\n` });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!r.stdout.includes(TOKEN));
  const s = JSON.parse(r.stdout);
  assert.equal(s.value, "[redacted]");
  assert.equal(s.hint, "sk_live_…6Wd3");
  assert.deepEqual(s.tags, ["billing"]);
  const raw = fs.readFileSync(path.join(vault, "vault.json"), "utf8");
  assert.ok(!raw.includes(TOKEN) && !raw.includes("Q7v2Lm9Xa4"), "value is not stored in plain text");
  if (process.platform !== "win32") assert.equal(fs.statSync(path.join(vault, "master.key")).mode & 0o777, 0o600);
});

test("literal values, duplicates and short values are refused", () => {
  assert.equal(mk(["set", "X1", `--value=${TOKEN}`]).status, 2);
  assert.equal(mk(["set", "SHOP_STRIPE_KEY", "--value=-"], { input: "other-value-1234567890" }).status, 4);
  assert.equal(mk(["set", "bad ref", "--value=-"], { input: "x" }).status, 2);
  assert.deepEqual(hintFor("short"), { hint: null, hintReason: "short value" });
});

test("get, search, list, annotate and rotate work on metadata only", () => {
  const get = mk(["get", "SHOP_STRIPE_KEY"]);
  assert.match(get.stdout, /value\s+\[redacted\]/);
  assert.equal(JSON.parse(mk(["search", "stripe", "--environment", "production", "--json"]).stdout).length, 1);
  assert.equal(JSON.parse(mk(["search", "--environment", "staging", "--json"]).stdout).length, 0);
  assert.equal(mk(["annotate", "SHOP_STRIPE_KEY", "--description", "Billing key"]).status, 0);
  const rotated = JSON.parse(mk(["rotate", "SHOP_STRIPE_KEY", "--value=-", "--json"], { input: "sk_live_NEWVALUEabcdefghij9999" }).stdout);
  assert.equal(rotated.hint, "sk_live_…9999");
  assert.equal(rotated.description, "Billing key");
  assert.equal(rotated.provider, "stripe");
  assert.ok(rotated.rotated_at);
  mk(["rotate", "SHOP_STRIPE_KEY", "--value=-"], { input: TOKEN });
});

test("compare answers match or differs without printing values", () => {
  const same = mk(["compare", "SHOP_STRIPE_KEY", "--value=-", "--json"], { input: TOKEN });
  assert.equal(JSON.parse(same.stdout).result, "match");
  assert.equal(JSON.parse(mk(["compare", "SHOP_STRIPE_KEY", "--value=-", "--json"], { input: "sk_live_somethingElseEntirely1" }).stdout).result, "differs");
  assert.equal(mk(["compare", "SHOP_STRIPE_KEY", "--value=-"], { input: "short" }).status, 2);
  assert.ok(!same.stdout.includes(TOKEN));
});

test("import-env plans without values, skips examples and existing refs", () => {
  const dir = path.join(tmpDir("app"), "shop");
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, ".env.production"), `# comment\nexport DATABASE_URL="postgres://u:p@db/shop"\nEMPTY=\nAPI_TOKEN=abc123def456ghi789 # trailing\n`);
  fs.writeFileSync(path.join(dir, ".env.staging"), "API_TOKEN=staging-token-value-123456\n");
  fs.writeFileSync(path.join(dir, ".env.example"), "API_TOKEN=changeme\n");
  const dry = mk(["import-env", dir, "--dry-run", "--json"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.ok(!dry.stdout.includes("abc123def456") && !dry.stdout.includes("postgres://"));
  const plan = JSON.parse(dry.stdout);
  assert.deepEqual(plan.files, [".env.production", ".env.staging"]);
  assert.deepEqual(plan.refs.map((r) => r.ref).sort(), ["SHOP_API_TOKEN_PRODUCTION", "SHOP_API_TOKEN_STAGING", "SHOP_DATABASE_URL_PRODUCTION"]);
  assert.equal(mk(["import-env", dir]).status, 0);
  assert.equal(JSON.parse(mk(["import-env", dir, "--dry-run", "--json"]).stdout).counts["skip-existing"], 3);
  assert.deepEqual(parseDotenv(`A="x\\"y"\nB='z # not comment'\nC=v # c`), [
    { key: "A", value: 'x"y' },
    { key: "B", value: "z # not comment" },
    { key: "C", value: "v" }
  ]);
  assert.equal(refFor("my-app", "KEY", "default", false), "MY_APP_KEY");
});

test("run injects values for the user and redacts them in output", () => {
  const r = mk(["run", "--env", "TOKEN=SHOP_STRIPE_KEY", "--", process.execPath, "-e", "console.log('token is ' + process.env.TOKEN); console.error(process.argv[1])", "${secret:SHOP_STRIPE_KEY}"]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "token is [redacted:SHOP_STRIPE_KEY]");
  assert.equal(r.stderr.trim(), "[redacted:SHOP_STRIPE_KEY]");
  assert.ok(!(r.stdout + r.stderr).includes(TOKEN));
  const code = mk(["run", "--env", "TOKEN=SHOP_STRIPE_KEY", "--", process.execPath, "-e", "process.exit(4)"]);
  assert.equal(code.status, 4, "the program's exit code is kept");
});

test("an agent needs a user grant; once grants are used up", () => {
  const args = ["run", "--env", "TOKEN=SHOP_STRIPE_KEY", "--purpose", "smoke", "--", process.execPath, "-e", "console.log(process.env.TOKEN ? 'has token' : 'none')"];
  const first = mk(args, { agent: true });
  assert.equal(first.status, 7);
  assert.match(first.stderr, /mk secrets approve/);
  assert.equal(pending().length, 1);
  assert.equal(mk(["approve"], { agent: true }).status, 6, "agents cannot approve");

  approve({ ids: [], once: true });
  const second = mk(args, { agent: true });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout.trim(), "has token");
  assert.equal(mk(args, { agent: true }).status, 7, "a once grant covers one run");

  approve({ ids: [], ttl: "24h" });
  assert.equal(mk(args, { agent: true }).status, 0);
  assert.equal(mk(args, { agent: true }).status, 0);
  const grants = JSON.parse(mk(["grants", "--json"]).stdout).grants;
  assert.equal(grants.length, 1);
  assert.equal(grants[0].program, path.basename(process.execPath));

  const other = mk(["run", "--env", "OTHER=SHOP_STRIPE_KEY", "--", process.execPath, "-e", "0"], { agent: true });
  assert.equal(other.status, 7, "a grant is scoped to the variable");
  assert.equal(mk(["revoke", "--all"]).status, 0);
  assert.equal(mk(args, { agent: true }).status, 7);
});

test("reveal and delete are guarded; the audit log never holds values", () => {
  assert.equal(mk(["get", "SHOP_STRIPE_KEY", "--reveal"], { agent: true }).status, 6);
  assert.equal(mk(["get", "SHOP_STRIPE_KEY", "--reveal"]).status, 6, "needs an interactive terminal");
  assert.equal(mk(["delete", "SHOP_API_TOKEN_STAGING"]).status, 2);
  assert.equal(mk(["delete", "SHOP_API_TOKEN_STAGING", "--yes"]).status, 0);
  assert.equal(mk(["get", "SHOP_API_TOKEN_STAGING"]).status, 5);
  const log = fs.readFileSync(path.join(vault, "audit.jsonl"), "utf8");
  assert.ok(!log.includes(TOKEN) && !log.includes("abc123def456"));
  const entries = JSON.parse(mk(["audit", "--secret", "SHOP_STRIPE_KEY", "--json"]).stdout);
  assert.ok(entries.some((e) => e.action === "run" && e.decision === "pending" && e.agent));
  assert.ok(entries.some((e) => e.action === "compare"));
});

test("the secret-store choice is recorded per project or per user", async () => {
  const kb = await makeKb();
  assert.equal(JSON.parse(mk(["store", "--json"], { cwd: kb }).stdout).choice, null);
  assert.equal(mk(["store", "env-file", "--scope", "user"], { cwd: kb }).status, 0);
  assert.deepEqual(JSON.parse(mk(["store", "--json"], { cwd: kb }).stdout), { choice: "env-file", scope: "user" });
  assert.equal(mk(["store", "mk-vault"], { cwd: kb }).status, 0);
  assert.deepEqual(JSON.parse(mk(["store", "--json"], { cwd: kb }).stdout), { choice: "mk-vault", scope: "project" });
  assert.equal(mk(["store", "whatever"], { cwd: kb }).status, 2);
});

test("the secrets guard blocks agents from reading secret files", async () => {
  const kb = await makeKb();
  const read = (file) => handleHook("pre-tool", "claude", JSON.stringify({ cwd: kb, hook_event_name: "PreToolUse", tool_name: "Read", tool_input: { file_path: file } }));
  const decision = async (p) => JSON.parse((await p).stdout || "{}").hookSpecificOutput?.permissionDecision ?? null;
  const bash = (command) => handleHook("pre-tool", "claude", fixture("claude", "pre-tool-bash", { cwd: kb, command }));

  assert.equal(await decision(read(path.join(kb, "api", ".env"))), "deny");
  assert.equal(await decision(read(path.join(kb, "api", ".env.production"))), "deny");
  assert.equal(await decision(read(path.join(kb, "certs", "server.pem"))), "deny");
  assert.equal(await decision(read(path.join(kb, "api", ".env.example"))), null);
  assert.equal(await decision(read(path.join(kb, "api", "src", "environment.ts"))), null);
  assert.equal(await decision(bash("cat api/.env")), "deny");
  assert.equal(await decision(bash("grep TOKEN .env.local")), "deny");
  assert.equal(await decision(bash("mk secrets get SHOP_KEY --reveal")), "deny");
  assert.equal(await decision(bash("printenv | sort")), "deny");
  assert.equal(await decision(bash("ls -la && git status")), null);
  assert.equal(await decision(bash("mk secrets import-env api --dry-run")), null);
  const codex = await handleHook("pre-tool", "codex", fixture("codex", "pre-tool-bash", { cwd: kb, command: "head -5 .env" }));
  assert.equal(JSON.parse(codex.stdout).hookSpecificOutput.permissionDecision, "deny");
});
