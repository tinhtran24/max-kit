import { lintSkills } from "../core/skills-lint.mjs";
import { listPacks, loadPack } from "../core/model.mjs";
import { printResult } from "../core/util.mjs";

export default async function skills(argv) {
  const [sub] = argv;
  if (sub === "lint") return printResult(lintSkills()) ? 0 : 1;
  if (sub === "list") {
    for (const id of listPacks()) {
      const p = loadPack(id);
      const planned = p.meta.planned?.length ? `, ${p.meta.planned.length} planned` : "";
      console.log(`${id.padEnd(16)} ${String(p.skills.length).padStart(3)} skill(s), ${p.agents.length} agent(s)${planned}  ${p.meta.description || ""}`);
    }
    return 0;
  }
  console.error("usage: mk skills lint | skills list");
  return 2;
}
