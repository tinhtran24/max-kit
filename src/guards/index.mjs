import boot from "./boot.mjs";
import branch from "./branch.mjs";
import migration from "./migration.mjs";
import risky from "./risky.mjs";
import evidence from "./evidence.mjs";
import secrets from "./secrets.mjs";

export const EVENTS = ["session", "prompt", "pre-tool", "stop"];
export const GUARDS = [boot, branch, secrets, migration, risky, evidence];

const RANK = { deny: 3, block: 3, ask: 2 };

export function runGuards(input, cfg) {
  const active = GUARDS.filter((g) => g.events.includes(input.event) && !cfg.guards.disabled.includes(g.id));
  const contexts = [];
  let verdict = null;
  for (const guard of active) {
    let d;
    try {
      d = guard.decide(input, cfg);
    } catch (e) {
      process.stderr.write(`max-kit guard ${guard.id} failed open: ${e.message}\n`);
      continue;
    }
    if (!d) continue;
    if (d.type === "context") contexts.push(d.text);
    else if (!verdict || RANK[d.type] > RANK[verdict.type]) verdict = { ...d, guard: guard.id };
    if (verdict && RANK[verdict.type] === 3) break;
  }
  if (verdict) return verdict;
  return contexts.length ? { type: "context", text: contexts.join("\n\n") } : null;
}
