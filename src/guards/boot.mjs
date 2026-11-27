import fs from "node:fs";
import path from "node:path";

export const TEAM_RULES = "knowledge/synthesis/team-rules.md";
export const READ_ORDER = ["AGENTS.md", "knowledge/synthesis/agent-boot.md", "knowledge/harness/features-index.md"];

export function bootContext(cfg) {
  const rules = path.join(cfg.root, TEAM_RULES);
  const body = fs.existsSync(rules) ? fs.readFileSync(rules, "utf8").trim() : "(team rules file missing)";
  return `Knowledgebase control plane: ${cfg.root} (${cfg.project}). Relative paths below resolve from there.

Read before any non-trivial task, unless already in context: ${READ_ORDER.join(", ")}. Recent work: knowledge/synthesis/recent-changes.md.

===== ${TEAM_RULES} =====
${body}`;
}

export function promptContext(cfg) {
  return `Knowledgebase ${cfg.root} applies. Non-trivial task: match the feature in knowledge/harness/features-index.md first; the harness is the definition of done; no evidence means not done.`;
}

export default {
  id: "boot",
  events: ["session", "prompt"],
  decide(input, cfg) {
    return { type: "context", text: input.event === "session" ? bootContext(cfg) : promptContext(cfg) };
  }
};
