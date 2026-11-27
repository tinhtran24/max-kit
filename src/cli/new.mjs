import { loadConfig, requireRoot } from "../core/config.mjs";
import { newFeature, newRun } from "../core/harness/scaffold.mjs";
import { rel } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

export default async function newCmd(argv) {
  const args = parseArgs(argv, { options: ["repo"] });
  const [kind, ...rest] = args._;
  const cfg = loadConfig(requireRoot());
  if (kind === "feature") {
    const [id, title, area, trigger] = rest;
    const file = newFeature(cfg, { id, title, area, trigger });
    console.log(`created ${rel(cfg.root, file)} (draft); fill trigger, behavior, scope and verification, then npm run index`);
    return 0;
  }
  if (kind === "run") {
    const [ids, slug] = rest;
    const file = newRun(cfg, { ids: ids?.split(",").map((s) => s.trim()).filter(Boolean), slug, repo: args.options.repo });
    console.log(`created ${rel(cfg.root, file)}; fill result, tier and the output summary`);
    return 0;
  }
  console.error('usage: max-kit new feature <ID> "<title>" <area> [trigger] | new run <ID[,ID]> <slug> [--repo <id>]');
  return 2;
}
