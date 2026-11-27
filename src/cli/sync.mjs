import fs from "node:fs";
import path from "node:path";
import { loadConfig, requireRoot } from "../core/config.mjs";
import { buildModel } from "../core/model.mjs";
import { loadAdapters, renderTargets } from "../adapters/registry.mjs";
import { printResult, result, sameText } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

const MANIFEST = ".max-kit/rendered.json";
const PRUNABLE = [".claude/skills/", ".claude/agents/", ".agents/skills/"];

function pruneRendered(cfg, files, { check, dryRun, r }) {
  const manifest = path.join(cfg.root, MANIFEST);
  const now = files.map((f) => f.path).sort();
  let before = [];
  try {
    before = JSON.parse(fs.readFileSync(manifest, "utf8"));
  } catch {
    before = [];
  }
  const keep = new Set(now);
  for (const p of before) {
    if (keep.has(p) || !PRUNABLE.some((d) => p.startsWith(d))) continue;
    const abs = path.join(cfg.root, p);
    if (!fs.existsSync(abs)) continue;
    if (check) r.errors.push(`${p} is no longer rendered; run npm run sync`);
    else if (dryRun) r.notes.push(`would remove ${p}`);
    else {
      fs.rmSync(abs);
      let dir = path.dirname(abs);
      while (dir.startsWith(cfg.root) && dir !== cfg.root && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      }
      r.notes.push(`removed ${p}`);
    }
  }
  if (!check && !dryRun) {
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    fs.writeFileSync(manifest, `${JSON.stringify(now, null, 2)}\n`);
  }
}

export async function syncKnowledgebase(cfg, { check = false, dryRun = false, only } = {}) {
  const r = result(check ? "generated files" : "sync");
  const { adapters, problems } = await loadAdapters(cfg);
  r.errors.push(...problems);
  const ids = only || cfg.targets;
  const targets = [];
  for (const id of ids) {
    const entry = adapters.get(id);
    if (entry) targets.push(entry.adapter);
    else r.errors.push(`unknown target "${id}"; known: ${[...adapters.keys()].join(", ")}`);
  }
  const model = buildModel(cfg);
  r.errors.push(...(model.problems || []));
  const { files, errors } = renderTargets(model, targets);
  r.errors.push(...errors);
  pruneRendered(cfg, files, { check, dryRun, r });
  for (const f of files) {
    const abs = path.join(cfg.root, f.path);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
    if (sameText(current, f.content)) continue;
    if (check) r.errors.push(`${f.path} is out of date; run npm run sync`);
    else if (dryRun) r.notes.push(`would write ${f.path} (${f.owner})`);
    else {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, f.content);
      r.notes.push(`wrote ${f.path} (${f.owner})`);
    }
  }
  return r;
}

export default async function sync(argv) {
  const args = parseArgs(argv, { flags: ["check", "dry-run"], options: ["target"] });
  const cfg = loadConfig(requireRoot());
  const only = args.options.target?.split(",").map((s) => s.trim()).filter(Boolean);
  const r = await syncKnowledgebase(cfg, { check: args.flags.check, dryRun: args.flags["dry-run"], only });
  return printResult(r) ? 0 : 1;
}
