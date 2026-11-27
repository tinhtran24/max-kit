import fs from "node:fs";
import path from "node:path";
import { READ_ORDER, TEAM_RULES } from "../guards/boot.mjs";

export const COMMANDS = [
  ["npm run check", "Quality gate: harness lint, index, log, links, boot budget, generated files"],
  ["npm run new:feature -- <ID> \"<title>\" <area>", "New draft feature (only with a real trigger)"],
  ["npm run new:run -- <ID> <slug>", "New evidence file; fill result, tier and commit"],
  ["npm run log -- <kind> \"<title>\" [note]", "Append to this month's log"],
  ["npm run index", "Regenerate the feature index"],
  ["npm run rollup", "Regenerate the log index and recent changes"],
  ["npm run sync", "Re-render AGENTS.md and runtime files after changing the config or rules"]
];

export function buildModel(cfg) {
  const rulesFile = path.join(cfg.root, TEAM_RULES);
  return {
    project: cfg.project,
    root: cfg.root,
    idPrefix: cfg.idPrefix,
    repos: cfg.repos,
    branches: cfg.branches,
    readOrder: READ_ORDER,
    teamRulesPath: TEAM_RULES,
    teamRules: fs.existsSync(rulesFile) ? fs.readFileSync(rulesFile, "utf8").trim() : "",
    commands: COMMANDS
  };
}
