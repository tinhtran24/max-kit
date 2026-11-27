import { KIT_ROOT, loadConfig, requireRoot } from "../core/config.mjs";
import { lintSkills } from "../core/skills-lint.mjs";
import { lintHarness } from "../core/harness/lint.mjs";
import { writeIndex } from "../core/harness/index.mjs";
import { rollup } from "../core/harness/log.mjs";
import { lintLinks } from "../core/harness/links.mjs";
import { bootCheck } from "../core/harness/boot.mjs";
import { checkFreshness } from "../core/harness/freshness.mjs";
import { printResult } from "../core/util.mjs";
import { syncKnowledgebase } from "./sync.mjs";

export async function checkKnowledgebase(cfg) {
  const kitOnly = cfg.root === KIT_ROOT ? [lintSkills()] : [];
  return [...kitOnly, lintHarness(cfg), checkFreshness(cfg), writeIndex(cfg, { check: true }), rollup(cfg, { check: true }), lintLinks(cfg), bootCheck(cfg), await syncKnowledgebase(cfg, { check: true })];
}

export default async function check() {
  const cfg = loadConfig(requireRoot());
  const results = await checkKnowledgebase(cfg);
  const ok = results.map(printResult).every(Boolean);
  console.log(ok ? "\ncheck passed" : "\ncheck failed");
  return ok ? 0 : 1;
}
