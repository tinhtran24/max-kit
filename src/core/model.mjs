import fs from "node:fs";
import path from "node:path";
import { READ_ORDER, TEAM_RULES } from "../guards/boot.mjs";
import { KIT_ROOT } from "./config.mjs";
import { rel, walk } from "./util.mjs";

export function loadSkills(dir = path.join(KIT_ROOT, "skills")) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort()
    .map((name) => ({
      name,
      files: walk(path.join(dir, name), "")
        .sort()
        .map((f) => ({ path: rel(path.join(dir, name), f), content: fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n") }))
    }));
}

export function loadAgents(dir = path.join(KIT_ROOT, "agents")) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const text = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n");
      const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      const field = (k) => m?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].trim() || "";
      return { name: field("name") || f.slice(0, -3), description: field("description").replace(/^"(.*)"$/, "$1"), body: (m ? m[2] : text).trim(), raw: text };
    });
}

export const packsDir = () => process.env.MAX_KIT_PACKS_DIR || path.join(KIT_ROOT, "packs");

export function listPacks() {
  const dir = packsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, "pack.json")))
    .sort();
}

export function loadPack(id) {
  const dir = path.join(packsDir(), id);
  const file = path.join(dir, "pack.json");
  if (!fs.existsSync(file)) return null;
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  return { id, dir, meta, skills: loadSkills(path.join(dir, "skills")), agents: loadAgents(path.join(dir, "agents")) };
}

export function loadPacks(ids) {
  const packs = [];
  const problems = [];
  const seen = new Set();
  const visit = (id, from) => {
    if (seen.has(id)) return;
    seen.add(id);
    const p = loadPack(id);
    if (!p) {
      problems.push(`unknown pack "${id}"${from ? ` (required by ${from})` : ""}; available: ${listPacks().join(", ") || "none"}`);
      return;
    }
    for (const dep of p.meta.requires || []) visit(dep, id);
    packs.push(p);
  };
  for (const id of ids) visit(id);
  return { packs, problems };
}

export const COMMANDS = [
  ["npm run check", "Quality gate: harness lint, index, log, links, boot budget, generated files"],
  ["npm run new:feature -- <ID> \"<title>\" <area>", "New draft feature (only with a real trigger)"],
  ["npm run verify -- <ID>", "Run the feature's verification commands, record the run, mark passing on success"],
  ["npm run new:run -- <ID> <slug>", "New evidence file for manual protocols; fill result, tier and commit"],
  ["npm run log -- <kind> \"<title>\" [note]", "Append to this month's log"],
  ["npm run index", "Regenerate the feature index"],
  ["npm run rollup", "Regenerate the log index and recent changes"],
  ["npm run sync", "Re-render AGENTS.md and runtime files after changing the config or rules"]
];

export function buildModel(cfg) {
  const rulesFile = path.join(cfg.root, TEAM_RULES);
  const { packs, problems } = loadPacks(cfg.packs);
  return {
    project: cfg.project,
    root: cfg.root,
    idPrefix: cfg.idPrefix,
    repos: cfg.repos,
    branches: cfg.branches,
    readOrder: READ_ORDER,
    teamRulesPath: TEAM_RULES,
    teamRules: fs.existsSync(rulesFile) ? fs.readFileSync(rulesFile, "utf8").trim() : "",
    commands: COMMANDS,
    skills: loadSkills(),
    agents: loadAgents(),
    packs: packs.map((p) => p.id),
    packSkills: packs.flatMap((p) => p.skills),
    packAgents: packs.flatMap((p) => p.agents),
    problems
  };
}
