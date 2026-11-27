import { loadConfig, requireRoot } from "../core/config.mjs";
import { appendLog } from "../core/harness/log.mjs";
import { LOG_KINDS } from "../core/harness/store.mjs";
import { rel } from "../core/util.mjs";

export default async function log(argv) {
  const [kind, title, ...notes] = argv;
  if (!kind || !title) {
    console.error(`usage: max-kit log <${LOG_KINDS.join("|")}> "<title>" ["note" ...]`);
    return 2;
  }
  const cfg = loadConfig(requireRoot());
  const file = appendLog(cfg, kind, title, notes);
  console.log(`appended to ${rel(cfg.root, file)}; run npm run rollup`);
  return 0;
}
