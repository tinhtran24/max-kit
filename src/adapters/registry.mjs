import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import claude from "./claude/adapter.mjs";
import agentsMd from "./agents-md/adapter.mjs";
import { renderAgentsMd } from "./agents-md/render.mjs";
import { kitVersion } from "../core/config.mjs";

export const BUILT_IN = [claude, agentsMd];
const PACKAGE_PREFIX = "max-kit-adapter-";

const semver = (v) => String(v || "0.0.0").split(/[.+-]/).slice(0, 3).map(Number);
function atLeast(have, need) {
  const [a, b] = [semver(have), semver(need)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

export function validateAdapter(a, source) {
  const problems = [];
  if (!a || typeof a !== "object") return [`${source}: default export is not an object`];
  if (!/^[a-z][a-z0-9-]*$/.test(a.id || "")) problems.push(`${source}: id must be lower-case kebab`);
  if (!a.capabilities || typeof a.capabilities !== "object") problems.push(`${source}: capabilities missing`);
  else if (!Array.isArray(a.capabilities.hooks)) problems.push(`${source}: capabilities.hooks must be an array`);
  if (typeof a.render !== "function") problems.push(`${source}: render() missing`);
  if (a.capabilities?.hooks?.length && (typeof a.hookBridge?.parse !== "function" || typeof a.hookBridge?.respond !== "function")) {
    problems.push(`${source}: declares hooks but has no hookBridge.parse/respond`);
  }
  if (a.minKitVersion && !atLeast(kitVersion(), a.minKitVersion)) problems.push(`${source}: needs max-kit >= ${a.minKitVersion}`);
  return problems;
}

function discoverPackages(root) {
  const dir = path.join(root, "node_modules");
  if (!fs.existsSync(dir)) return [];
  const names = [];
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith(PACKAGE_PREFIX)) names.push(entry);
    else if (entry.startsWith("@") && fs.statSync(path.join(dir, entry)).isDirectory()) {
      for (const sub of fs.readdirSync(path.join(dir, entry))) if (sub.startsWith(PACKAGE_PREFIX)) names.push(`${entry}/${sub}`);
    }
  }
  return names;
}

export async function loadAdapters(cfg) {
  const adapters = new Map(BUILT_IN.map((a) => [a.id, { adapter: a, source: "built-in" }]));
  const problems = [];
  if (!cfg) return { adapters, problems };
  const require = createRequire(path.join(cfg.root, "package.json"));
  const specs = [...new Set([...discoverPackages(cfg.root), ...cfg.adapters])];
  for (const spec of specs) {
    let resolved;
    try {
      resolved = spec.startsWith(".") || path.isAbsolute(spec) ? path.resolve(cfg.root, spec) : require.resolve(spec);
      const mod = await import(pathToFileURL(resolved).href);
      const a = mod.default;
      const issues = validateAdapter(a, spec);
      if (issues.length) problems.push(...issues);
      else if (adapters.has(a.id) && adapters.get(a.id).source === "built-in") problems.push(`${spec}: id "${a.id}" is built in; pick another id`);
      else adapters.set(a.id, { adapter: a, source: spec });
    } catch (e) {
      problems.push(`${spec}: cannot load (${e.message.split("\n")[0]})`);
    }
  }
  return { adapters, problems };
}

export async function getAdapter(id, cfg) {
  const builtIn = BUILT_IN.find((a) => a.id === id);
  if (builtIn) return builtIn;
  const { adapters } = await loadAdapters(cfg);
  return adapters.get(id)?.adapter || null;
}

export function renderTargets(model, targets) {
  const files = new Map();
  const errors = [];
  const add = (file, owner) => {
    const prev = files.get(file.path);
    if (prev && prev.content !== file.content) errors.push(`${file.path}: rendered differently by ${prev.owner} and ${owner}`);
    else files.set(file.path, { ...file, owner });
  };
  if (targets.some((a) => a.capabilities.instructions !== "none")) {
    const inlineRules = targets.some((a) => !a.capabilities.hooks.includes("session"));
    add({ path: "AGENTS.md", content: renderAgentsMd(model, { inlineRules }) }, "core");
  }
  for (const a of targets) for (const f of a.render(model) || []) add(f, a.id);
  return { files: [...files.values()], errors };
}
