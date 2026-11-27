import fs from "node:fs";
import path from "node:path";
import { CREATES, filesOf } from "./files.mjs";

const norm = (p) => p.split(path.sep).join("/");

export default {
  id: "migration",
  events: ["pre-tool"],
  decide(input, cfg) {
    const { tool } = input;
    if (tool.kind !== "write" && tool.kind !== "edit") return null;
    for (const f of filesOf(tool)) {
      if (!CREATES.has(f.op)) continue;
      const file = path.resolve(input.cwd, f.path);
      if (fs.existsSync(file)) continue;
      const target = norm(file);
      if (!cfg.guards.migrationPaths.some((p) => target.includes(p))) continue;
      const repo = cfg.repos.find((r) => target.startsWith(norm(path.join(cfg.root, r.path)) + "/"));
      const where = repo?.container ? ` inside the ${repo.container} container` : "";
      const how = repo?.migrationGenerator ? ` Generate it${where} with: ${repo.migrationGenerator}` : ` Use the repo's own migration generator${where} (see its instructions file).`;
      return { type: "deny", reason: `New migration files must come from the generator, named by what they do, never hand-written.${how} Then edit the generated file.` };
    }
    return null;
  }
};
