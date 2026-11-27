import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { run } from "../src/cli/index.mjs";
import { loadConfig } from "../src/core/config.mjs";

export const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

export async function quiet(fn) {
  const saved = [console.log, console.warn, console.error];
  console.log = console.warn = console.error = () => {};
  try {
    return await fn();
  } finally {
    [console.log, console.warn, console.error] = saved;
  }
}

export function tmpDir(name = "kb") {
  return fs.mkdtempSync(path.join(os.tmpdir(), `max-kit-${name}-`));
}

export async function makeKb({ prefix = "SHOP", extra = [] } = {}) {
  const dir = path.join(tmpDir(), "shop-kb");
  const code = await quiet(() => run(["init", dir, "--project", "shop", "--id-prefix", prefix, "--no-git", ...extra]));
  if (code !== 0) throw new Error(`init exited ${code}`);
  return dir;
}

export function editConfig(dir, change) {
  const file = path.join(dir, "max-kit.config.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  change(raw);
  fs.writeFileSync(file, JSON.stringify(raw, null, 2));
  return loadConfig(dir);
}

export function gitRepo(dir, branch = "main") {
  fs.mkdirSync(dir, { recursive: true });
  const g = (...args) => execFileSync("git", ["-C", dir, ...args], { stdio: "ignore" });
  g("init", "-q", "-b", branch);
  g("config", "user.email", "test@example.com");
  g("config", "user.name", "test");
  fs.writeFileSync(path.join(dir, "README.md"), "x\n");
  g("add", ".");
  g("commit", "-q", "-m", "init");
  return dir;
}

export function fixture(runtime, name, vars) {
  let text = fs.readFileSync(path.join(FIXTURES, runtime, `${name}.json`), "utf8");
  for (const [k, v] of Object.entries(vars)) text = text.split(`{{${k}}}`).join(typeof v === "string" ? JSON.stringify(v).slice(1, -1) : String(v));
  return text;
}
