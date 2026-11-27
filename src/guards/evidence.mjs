import fs from "node:fs";
import path from "node:path";
import { isDirty } from "../core/git.mjs";

const WINDOW_MS = 12 * 60 * 60 * 1000;

function recentRun(root) {
  const dir = path.join(root, "knowledge", "harness", "runs");
  if (!fs.existsSync(dir)) return false;
  const cutoff = Date.now() - WINDOW_MS;
  return fs.readdirSync(dir).some((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f) && fs.statSync(path.join(dir, f)).mtimeMs >= cutoff);
}

export default {
  id: "evidence",
  events: ["stop"],
  decide(input, cfg) {
    if (input.stopActive || !cfg.guards.evidenceReminder) return null;
    const dirty = cfg.repos.filter((r) => {
      const dir = path.join(cfg.root, r.path);
      return fs.existsSync(dir) && isDirty(dir);
    });
    if (!dirty.length || recentRun(cfg.root)) return null;
    return {
      type: "block",
      reason: `Uncommitted changes in ${dirty.map((r) => r.id).join(", ")} and no harness run in the last 12 hours. Before finishing: record evidence (npm run new:run -- <ID> <slug>) or say why none is needed.`
    };
  }
};
