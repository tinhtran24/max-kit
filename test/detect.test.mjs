import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectRepo } from "../src/core/detect/index.mjs";
import { detectAndWrite } from "../src/cli/detect.mjs";
import { handleHook } from "../src/cli/hook.mjs";
import { listProfiles, loadConfig, loadProfile } from "../src/core/config.mjs";
import { run } from "../src/cli/index.mjs";
import { editConfig, fixture, FIXTURES, gitRepo, makeKb, quiet, tmpDir } from "./helpers.mjs";

const REPOS = path.join(FIXTURES, "repos");
const GOLDEN = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden", "detect.json");
const silent = { log: () => {} };

function addRepo(kb, fixtureName, as) {
  const dir = path.join(kb, as);
  fs.cpSync(path.join(REPOS, fixtureName), dir, { recursive: true });
  gitRepo(dir, "develop");
  return dir;
}

test("detection per stack matches the golden file", () => {
  const actual = Object.fromEntries(
    fs
      .readdirSync(REPOS)
      .sort()
      .map((name) => [name, detectRepo(path.join(REPOS, name))])
  );
  if (process.env.UPDATE_GOLDEN) fs.writeFileSync(GOLDEN, `${JSON.stringify(actual, null, 2)}\n`);
  assert.deepEqual(actual, JSON.parse(fs.readFileSync(GOLDEN, "utf8")));
});

test("every profile loads and inherits the generic guards", () => {
  const generic = loadProfile("generic");
  for (const id of listProfiles()) {
    const p = loadProfile(id);
    assert.equal(p.id, id);
    for (const pattern of generic.riskyCommands) assert.ok(p.riskyCommands.includes(pattern), `${id} keeps ${pattern}`);
    for (const pattern of p.riskyCommands) assert.doesNotThrow(() => new RegExp(pattern), `${id}: ${pattern}`);
  }
});

test("detect --write adds repos and fills only empty fields", async () => {
  const kb = await makeKb();
  addRepo(kb, "rails-rspec", "api");
  addRepo(kb, "node-prisma-pnpm", "web");
  editConfig(kb, (c) => (c.repos = [{ id: "web", path: "web", testCommand: "pnpm test:unit" }]));

  const { changes } = await detectAndWrite(kb, { write: true, ...silent });
  assert.ok(changes.includes("add repo api (api)"));
  const cfg = loadConfig(kb);
  const api = cfg.raw.repos.find((r) => r.id === "api");
  const web = cfg.raw.repos.find((r) => r.id === "web");
  assert.deepEqual(api, { id: "api", path: "api", profile: "rails", testCommand: "bundle exec rspec", migrationGenerator: "bin/rails generate migration <Name>", container: "shop_api" });
  assert.equal(web.testCommand, "pnpm test:unit");
  assert.equal(web.migrationGenerator, "pnpm exec prisma migrate dev --create-only --name <name>");
  assert.equal(cfg.profile, "generic", "mixed stacks keep the generic project profile");
  assert.match(fs.readFileSync(path.join(kb, "AGENTS.md"), "utf8"), /\| api \| `api` \| rails \| `bundle exec rspec` \|/);

  const again = await detectAndWrite(kb, { write: true, ...silent });
  assert.deepEqual(again.changes, []);
});

test("init --detect on a folder with one stack sets the project profile", async () => {
  const dir = path.join(tmpDir(), "kb");
  fs.mkdirSync(dir);
  addRepo(dir, "laravel", "app");
  const code = await quiet(() => run(["init", dir, "--project", "shop", "--id-prefix", "SHOP", "--no-git", "--force", "--detect"]));
  assert.equal(code, 0);
  const cfg = loadConfig(dir);
  assert.equal(cfg.profile, "laravel");
  assert.equal(cfg.repos[0].testCommand, "./vendor/bin/pest");
  assert.equal(cfg.repos[0].container, "app");
});

const CASES = [
  ["rails-rspec", "db/migrate/20260101000000_add_total.rb", /bin\/rails generate migration <Name>/],
  ["laravel", "database/migrations/2026_01_01_000000_add_total.php", /php artisan make:migration/],
  ["django", "orders/migrations/0002_add_total.py", /makemigrations/],
  ["go-goose", "db/migrations/20260101_add_total.sql", /goose -dir db\/migrations create/],
  ["node-prisma-pnpm", "prisma/migrations/20260101_add_total/migration.sql", /prisma migrate dev --create-only/],
  ["php-dbmate", "db/migrations/20260101_add_total.sql", /dbmate new <name>/]
];

for (const [name, rel, generator] of CASES) {
  test(`migration guard blocks a hand-written file for ${name}`, async () => {
    const kb = await makeKb();
    const dir = addRepo(kb, name, "app");
    await detectAndWrite(kb, { write: true, ...silent });
    const file = path.join(dir, ...rel.split("/"));
    const out = await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-write", { cwd: dir, file }));
    const d = JSON.parse(out.stdout).hookSpecificOutput;
    assert.equal(d.permissionDecision, "deny");
    assert.match(d.permissionDecisionReason, generator);
  });
}

test("the migration message names the container", async () => {
  const kb = await makeKb();
  const dir = addRepo(kb, "rails-rspec", "api");
  await detectAndWrite(kb, { write: true, ...silent });
  const out = await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-write", { cwd: dir, file: path.join(dir, "db", "migrate", "1_x.rb") }));
  assert.match(JSON.parse(out.stdout).hookSpecificOutput.permissionDecisionReason, /inside the shop_api container/);
});

test("profile risky commands apply to repos of that stack", async () => {
  const kb = await makeKb();
  addRepo(kb, "rails-rspec", "api");
  await detectAndWrite(kb, { write: true, ...silent });
  const ask = async (command) =>
    JSON.parse((await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-bash", { cwd: kb, command }))).stdout || "{}").hookSpecificOutput?.permissionDecision ?? null;
  assert.equal(await ask("bundle exec sidekiq -C config/sidekiq.yml"), "ask");
  assert.equal(await ask("bin/rails db:reset"), "ask");
  assert.equal(await ask("bin/rails test"), null);
});
