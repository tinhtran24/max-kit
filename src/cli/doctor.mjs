import fs from "node:fs";
import path from "node:path";
import { CONFIG_FILE, findRoot, kitVersion, loadConfig } from "../core/config.mjs";
import { loadAdapters } from "../adapters/registry.mjs";
import { syncKnowledgebase } from "./sync.mjs";

export default async function doctor() {
  let problems = 0;
  const ok = (m) => console.log(`  ok    ${m}`);
  const bad = (m) => {
    problems++;
    console.log(`  fix   ${m}`);
  };
  const info = (m) => console.log(`  info  ${m}`);

  console.log(`max-kit ${kitVersion()}`);
  const major = Number(process.versions.node.split(".")[0]);
  major >= 20 ? ok(`node ${process.versions.node}`) : bad(`node ${process.versions.node}; need 20 or newer`);

  const root = findRoot();
  if (!root) {
    bad(`no ${CONFIG_FILE} found from ${process.cwd()} upward; run max-kit init`);
    return 1;
  }
  ok(`knowledgebase ${root}`);
  let cfg;
  try {
    cfg = loadConfig(root);
    ok(`config valid (profile ${cfg.profile})`);
  } catch (e) {
    bad(`config: ${e.message}`);
    return 1;
  }
  if (cfg.kitVersion && cfg.kitVersion !== kitVersion()) info(`knowledgebase was set up with kit ${cfg.kitVersion}; run max-kit update`);
  fs.existsSync(path.join(root, ".git")) ? ok("git repository") : bad("not a git repository; run git init");
  fs.existsSync(path.join(root, "node_modules", "yaml")) || fs.existsSync(path.join(root, "node_modules", "max-kit")) ? ok("dependencies installed") : bad("dependencies missing; run npm install");

  for (const r of cfg.repos) fs.existsSync(path.join(root, r.path)) ? ok(`repo ${r.id} at ${r.path}`) : bad(`repo ${r.id}: ${r.path} not found`);

  const { adapters, problems: adapterProblems } = await loadAdapters(cfg);
  for (const p of adapterProblems) bad(p);
  for (const id of cfg.targets) {
    const entry = adapters.get(id);
    if (!entry) {
      bad(`target ${id}: no adapter`);
      continue;
    }
    const d = entry.adapter.detect?.({ cfg });
    d?.used ? ok(`target ${id}: ${d.note || "detected"}`) : info(`target ${id}: ${d?.note || "not detected"}`);
  }

  const sync = await syncKnowledgebase(cfg, { check: true });
  sync.errors.length ? bad(`generated files out of date (${sync.errors.length}); run npm run sync`) : ok("generated files up to date");

  console.log(problems ? `\n${problems} problem(s)` : "\nall good");
  return problems ? 1 : 0;
}
