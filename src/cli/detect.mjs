import fs from "node:fs";
import path from "node:path";
import { CONFIG_FILE, loadConfig, requireRoot } from "../core/config.mjs";
import { detectAll, mergeDetected } from "../core/detect/index.mjs";
import { syncKnowledgebase } from "./sync.mjs";
import { printResult } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

export async function detectAndWrite(root, { write = false, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const detected = detectAll(cfg);
  if (!detected.length) {
    log("no app repos found: add checkouts inside this folder (each with its own .git) or list them in max-kit.config.json › repos");
    return { changes: [] };
  }
  for (const d of detected) {
    if (!d.found) {
      log(`${d.id} (${d.path}): path not found`);
      continue;
    }
    const f = d.found;
    log(`${d.id} (${d.path})`);
    log(`  profile             ${f.profile}`);
    log(`  test command        ${f.testCommand || "-"}`);
    log(`  migration generator ${f.migrationGenerator || "-"}`);
    log(`  container           ${f.container || "-"}`);
    log(`  signals             ${f.signals.join(", ") || "-"}`);
  }
  const { config, changes } = mergeDetected(cfg.raw, detected);
  if (!changes.length) {
    log("\nconfig already has these values; nothing to change");
    return { changes };
  }
  log(`\n${write ? "applied" : "would apply"} (fills empty fields only; values you set are kept):`);
  for (const c of changes) log(`  ${c}`);
  if (write) {
    fs.writeFileSync(path.join(root, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);
    const r = await syncKnowledgebase(loadConfig(root));
    if (r.errors.length) printResult(r);
  } else log("\nrun with --write to save");
  return { changes };
}

export default async function detect(argv) {
  const args = parseArgs(argv, { flags: ["write"] });
  await detectAndWrite(requireRoot(), { write: args.flags.write });
  return 0;
}
