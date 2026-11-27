import { findRoot, KIT_ROOT, loadConfig } from "../core/config.mjs";
import { getAdapter } from "../adapters/registry.mjs";
import { parseArgs } from "./args.mjs";

export default async function install(argv) {
  const args = parseArgs(argv, { options: ["source"] });
  const runtime = args._[0];
  if (!runtime) {
    console.error("usage: max-kit install <runtime> [--source <path|owner/repo>]");
    return 2;
  }
  const root = findRoot();
  const adapter = await getAdapter(runtime, root ? loadConfig(root) : null);
  if (!adapter) throw new Error(`unknown runtime ${runtime}`);
  if (typeof adapter.install !== "function") {
    console.log(`${runtime} needs no install step; run npm run sync`);
    return 0;
  }
  const notes = adapter.install({ source: args.options.source || KIT_ROOT }) || [];
  for (const n of notes) console.log(n);
  return 0;
}
