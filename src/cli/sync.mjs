import fs from "node:fs";
import path from "node:path";
import { loadConfig, requireRoot } from "../core/config.mjs";
import { buildModel } from "../core/model.mjs";
import { loadAdapters, renderTargets } from "../adapters/registry.mjs";
import { printResult, result } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

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
  const { files, errors } = renderTargets(buildModel(cfg), targets);
  r.errors.push(...errors);
  for (const f of files) {
    const abs = path.join(cfg.root, f.path);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
    if (current === f.content) continue;
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
