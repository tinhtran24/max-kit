import fs from "node:fs";
import path from "node:path";

const norm = (p) => p.split(path.sep).join("/");

export default {
  id: "migration",
  events: ["pre-tool"],
  decide(input, cfg) {
    const { tool } = input;
    if (tool.kind !== "write" || !tool.filePath) return null;
    const file = path.resolve(input.cwd, tool.filePath);
    if (fs.existsSync(file)) return null;
    const target = norm(file);
    if (!cfg.guards.migrationPaths.some((p) => target.includes(p))) return null;
    const repo = cfg.repos.find((r) => target.startsWith(norm(path.join(cfg.root, r.path)) + "/"));
    const how = repo?.migrationGenerator ? ` Generate it with: ${repo.migrationGenerator}` : " Use the repo's own migration generator (see its instructions file).";
    return { type: "deny", reason: `New migration files must come from the generator, named by what they do, never hand-written.${how} Then edit the generated file.` };
  }
};
