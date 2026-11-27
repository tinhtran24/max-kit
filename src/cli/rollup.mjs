import path from "node:path";
import { loadConfig, requireRoot } from "../core/config.mjs";
import { rollup, splitLog } from "../core/harness/log.mjs";
import { printResult, rel } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

export default async function rollupCmd(argv) {
  const args = parseArgs(argv, { flags: ["check"], options: ["split"] });
  const cfg = loadConfig(requireRoot());
  if (args.options.split) {
    const written = splitLog(cfg, path.resolve(args.options.split));
    for (const f of written) console.log(`wrote ${rel(cfg.root, f)}`);
    console.log("existing month files were kept; run npm run rollup next");
    return 0;
  }
  return printResult(rollup(cfg, { check: args.flags.check })) ? 0 : 1;
}
