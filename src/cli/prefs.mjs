import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONFIG_FILE, findRoot } from "../core/config.mjs";
import { parseArgs } from "./args.mjs";

const userFile = () => path.join(process.env.MK_PREFS_DIR || process.env.MAX_KIT_HOME || path.join(os.homedir(), ".max-kit"), "prefs.json");
const readJson = (f) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return {};
  }
};

function getPath(obj, key) {
  return key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function setPath(obj, key, value) {
  const parts = key.split(".");
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p] && typeof o[p] === "object" ? o[p] : (o[p] = {});
  if (value === undefined) delete o[parts.at(-1)];
  else o[parts.at(-1)] = value;
  return obj;
}

function prune(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      prune(v);
      if (!Object.keys(v).length) delete obj[k];
    }
  }
  return obj;
}

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" ? merge(out[k], v) : v;
  return out;
}

function parseValue(v) {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export function resolvePrefs(cwd = process.cwd()) {
  const user = readJson(userFile()).prefs || {};
  const root = findRoot(cwd);
  const project = root ? readJson(path.join(root, CONFIG_FILE)).prefs || {} : {};
  return { prefs: merge(user, project), sources: { user: userFile(), project: root ? path.join(root, CONFIG_FILE) : null } };
}

function write(scope, mutate) {
  if (scope === "user") {
    const f = userFile();
    const d = readJson(f);
    d.prefs = prune(mutate(d.prefs || {}));
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, `${JSON.stringify(d, null, 2)}\n`);
    return f;
  }
  const root = findRoot();
  if (!root) throw new Error(`no ${CONFIG_FILE} here; use --scope user`);
  const f = path.join(root, CONFIG_FILE);
  const d = readJson(f);
  d.prefs = prune(mutate(d.prefs || {}));
  if (!Object.keys(d.prefs).length) delete d.prefs;
  fs.writeFileSync(f, `${JSON.stringify(d, null, 2)}\n`);
  return f;
}

export default async function prefs(argv) {
  const o = parseArgs(argv, { flags: ["json"], options: ["scope"] });
  const [sub = "resolve", key, value] = o._;
  const scope = o.options.scope || "project";
  if (!["project", "user"].includes(scope)) throw new Error("--scope must be project or user");
  switch (sub) {
    case "resolve": {
      const r = resolvePrefs();
      console.log(o.flags.json ? JSON.stringify(r, null, 2) : JSON.stringify(r.prefs, null, 2));
      return 0;
    }
    case "get": {
      if (!key) throw new Error("usage: mk prefs get <key>");
      const v = getPath(resolvePrefs().prefs, key);
      if (v === undefined) return 1;
      console.log(typeof v === "string" ? v : JSON.stringify(v));
      return 0;
    }
    case "set": {
      if (!key || value === undefined) throw new Error("usage: mk prefs set <key> <value> [--scope project|user]");
      const f = write(scope, (p) => setPath(p, key, parseValue(value)));
      console.log(`${key} = ${value} (${scope}: ${f})`);
      return 0;
    }
    case "unset": {
      if (!key) throw new Error("usage: mk prefs unset <key> [--scope project|user]");
      write(scope, (p) => setPath(p, key, undefined));
      console.log(`unset ${key} (${scope})`);
      return 0;
    }
    case "validate": {
      const r = resolvePrefs();
      console.log(`prefs valid: ${Object.keys(r.prefs).length} top-level key(s)`);
      return 0;
    }
    default:
      console.error("usage: mk prefs [resolve|get <key>|set <key> <value>|unset <key>|validate] [--scope project|user] [--json]");
      return 2;
  }
}
