import fs from "node:fs";
import path from "node:path";
import { vaultDir } from "./keystore.mjs";
import { underAgent } from "./agent.mjs";

const file = () => path.join(vaultDir(), "audit.jsonl");

export function audit(action, fields = {}) {
  try {
    fs.mkdirSync(vaultDir(), { recursive: true, mode: 0o700 });
    fs.appendFileSync(file(), `${JSON.stringify({ at: new Date().toISOString(), action, agent: underAgent(), cwd: process.cwd(), ...fields })}\n`, { mode: 0o600 });
  } catch {
    /* audit must never break the command */
  }
}

export function readAudit({ ref, decision, sinceMs } = {}) {
  if (!fs.existsSync(file())) return [];
  return fs
    .readFileSync(file(), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((e) => (!ref || e.ref === ref || (e.refs || []).includes(ref)) && (!decision || e.decision === decision) && (!sinceMs || Date.parse(e.at) >= Date.now() - sinceMs));
}
