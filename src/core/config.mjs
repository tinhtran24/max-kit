import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existingDir, readJson } from "./util.mjs";

export const CONFIG_FILE = "max-kit.config.json";
export const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function kitVersion() {
  return readJson(path.join(KIT_ROOT, "package.json")).version;
}

export function findRoot(start = process.cwd()) {
  if (process.env.MAX_KIT_ROOT) {
    const r = path.resolve(process.env.MAX_KIT_ROOT);
    return fs.existsSync(path.join(r, CONFIG_FILE)) ? r : null;
  }
  let d = existingDir(start);
  for (;;) {
    if (fs.existsSync(path.join(d, CONFIG_FILE)) && fs.existsSync(path.join(d, "knowledge"))) return d;
    const parent = path.dirname(d);
    if (parent === d) return null;
    d = parent;
  }
}

export function requireRoot(start) {
  const root = findRoot(start);
  if (!root) throw new Error(`no ${CONFIG_FILE} found from ${start ?? process.cwd()} upward; run max-kit init first`);
  return root;
}

export function listProfiles() {
  return fs
    .readdirSync(path.join(KIT_ROOT, "profiles"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
}

export function loadProfile(id, seen = new Set()) {
  if (seen.has(id)) throw new Error(`profile cycle at ${id}`);
  seen.add(id);
  const file = path.join(KIT_ROOT, "profiles", `${id}.json`);
  if (!fs.existsSync(file)) throw new Error(`unknown profile "${id}"; available: ${listProfiles().join(", ")}`);
  const p = readJson(file);
  if (!p.extends) return p;
  const base = loadProfile(p.extends, seen);
  return {
    ...base,
    ...p,
    migrations: { ...base.migrations, ...p.migrations, paths: [...(base.migrations?.paths || []), ...(p.migrations?.paths || [])] },
    riskyCommands: [...(base.riskyCommands || []), ...(p.riskyCommands || [])],
    secretPaths: [...(base.secretPaths || []), ...(p.secretPaths || [])]
  };
}

const uniq = (list) => [...new Set(list)];

export function loadConfig(root) {
  const raw = readJson(path.join(root, CONFIG_FILE));
  const profile = loadProfile(raw.profile || "generic");
  const guards = raw.guards || {};
  const idPrefix = raw.idPrefix || "";
  const repos = (raw.repos || []).map((r) => {
    const rp = r.profile ? loadProfile(r.profile) : profile;
    return {
      id: r.id,
      path: r.path,
      profile: r.profile || profile.id,
      container: r.container || "",
      testCommand: r.testCommand || rp.testCommand || "",
      migrationGenerator: r.migrationGenerator || rp.migrations?.generator || "",
      migrationPaths: rp.migrations?.paths || []
    };
  });
  return {
    root,
    raw,
    project: raw.project || path.basename(root),
    idPrefix,
    profile: profile.id,
    repos,
    targets: raw.targets || ["claude"],
    packs: raw.packs || [],
    adapters: raw.adapters || [],
    branches: {
      protected: raw.branches?.protected || ["main", "master"],
      deploy: raw.branches?.deploy || []
    },
    guards: {
      riskyCommands: uniq([...(profile.riskyCommands || []), ...repos.flatMap((r) => (r.profile !== profile.id ? loadProfile(r.profile).riskyCommands || [] : [])), ...(guards.riskyCommands?.extend || [])]),
      migrationPaths: uniq([...(profile.migrations?.paths || []), ...repos.flatMap((r) => r.migrationPaths), ...(guards.migrationPaths?.extend || [])]),
      evidenceReminder: guards.evidenceReminder ?? true,
      askFallback: guards.askFallback === "warn" ? "warn" : "deny",
      disabled: guards.disabled || []
    },
    harness: {
      idPattern: raw.harness?.idPattern || (idPrefix ? `^${idPrefix}(-[A-Z0-9]+)+-[0-9]{3}$` : "^[A-Z][A-Z0-9]*(-[A-Z0-9]+)+-[0-9]{3}$"),
      staleActiveDays: raw.harness?.staleActiveDays ?? 30,
      staleVerifiedDays: raw.harness?.staleVerifiedDays ?? 120,
      staleEvidence: raw.harness?.staleEvidence === "error" ? "error" : "warn"
    },
    boot: {
      maxChars: raw.boot?.maxChars ?? 9000,
      maxInstructionLines: raw.boot?.maxInstructionLines ?? 80,
      ruleFiles: raw.boot?.ruleFiles || ["knowledge/synthesis/agent-boot.md", "knowledge/synthesis/team-rules.md", "knowledge/README.md"]
    },
    kitVersion: raw.kitVersion || ""
  };
}

export const kb = (cfg, ...p) => path.join(cfg.root, "knowledge", ...p);
