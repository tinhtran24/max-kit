import fs from "node:fs";
import path from "node:path";
import { CONFIG_FILE, kitVersion, loadConfig, requireRoot } from "../core/config.mjs";
import { readJson } from "../core/util.mjs";
import { copyTemplate, TEMPLATE_DIR } from "./init.mjs";
import { syncKnowledgebase } from "./sync.mjs";
import { printResult } from "../core/util.mjs";

export const KIT_OWNED = ["knowledge/templates/", "knowledge/harness/README.md", "knowledge/harness/runs/README.md", "knowledge/README.md"];

export default async function update() {
  const root = requireRoot();
  const raw = readJson(path.join(root, CONFIG_FILE));
  const written = copyTemplate(TEMPLATE_DIR, root, { project: raw.project, idPrefix: raw.idPrefix, kitSpec: "", date: "" }, { only: (p) => KIT_OWNED.some((k) => (k.endsWith("/") ? p.startsWith(k) : p === k)) });
  for (const f of written) console.log(`updated ${f}`);

  const pkgFile = path.join(root, "package.json");
  if (fs.existsSync(pkgFile)) {
    const pkg = readJson(pkgFile);
    const tpl = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, "package.json"), "utf8"));
    pkg.scripts = { ...pkg.scripts, ...tpl.scripts };
    fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log("updated package.json scripts");
  }

  raw.kitVersion = kitVersion();
  fs.writeFileSync(path.join(root, CONFIG_FILE), `${JSON.stringify(raw, null, 2)}\n`);
  const ok = printResult(await syncKnowledgebase(loadConfig(root)));
  console.log(`kit ${raw.kitVersion} applied. Review git diff, then npm run check`);
  return ok ? 0 : 1;
}
