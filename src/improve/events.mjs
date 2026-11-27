import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const SKILL_ERROR_SESSIONS = 3;
export const GUARD_HITS = 5;
const WINDOW_MS = 14 * 86400000;

export const improveDir = (root) => path.join(root, ".max-kit", "improve");
const eventsFile = (root) => path.join(improveDir(root), "events.jsonl");
const nudgedFile = (root) => path.join(improveDir(root), "nudged.json");

export function enabled(cfg) {
  return cfg.raw?.improve?.enabled !== false && !cfg.guards.disabled.includes("improve");
}

export function appendEvent(root, event) {
  fs.mkdirSync(improveDir(root), { recursive: true });
  const e = { id: crypto.randomBytes(5).toString("hex"), at: new Date().toISOString(), ...event };
  fs.appendFileSync(eventsFile(root), `${JSON.stringify(e)}\n`);
  return e;
}

const sessionsDir = (root) => path.join(improveDir(root), "sessions");

export function recordSession(root, sessionId, summary) {
  const id = crypto.createHash("sha256").update(String(sessionId || "unknown")).digest("hex").slice(0, 10);
  fs.mkdirSync(sessionsDir(root), { recursive: true });
  const file = path.join(sessionsDir(root), `${id}.json`);
  let started = new Date().toISOString();
  try {
    started = JSON.parse(fs.readFileSync(file, "utf8")).started || started;
  } catch {
    /* first stop of this session */
  }
  const e = { id, kind: "session", started, at: new Date().toISOString(), ...summary };
  fs.writeFileSync(file, `${JSON.stringify(e)}\n`);
  return e;
}

export function readEvents(root, { sinceMs } = {}) {
  const keep = (e) => e && (!sinceMs || Date.parse(e.at) >= Date.now() - sinceMs);
  const parse = (l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  };
  const guards = fs.existsSync(eventsFile(root)) ? fs.readFileSync(eventsFile(root), "utf8").split("\n").filter(Boolean).map(parse) : [];
  const sessions = fs.existsSync(sessionsDir(root)) ? fs.readdirSync(sessionsDir(root)).map((f) => parse(fs.readFileSync(path.join(sessionsDir(root), f), "utf8"))) : [];
  return [...sessions, ...guards].filter(keep).sort((a, b) => a.at.localeCompare(b.at));
}

export function clearEvents(root) {
  fs.rmSync(improveDir(root), { recursive: true, force: true });
}

const toolError = (block) => block?.type === "tool_result" && block.is_error === true;

export function summariseTranscript(file) {
  const out = { skills: [], tool_calls: 0, tool_errors: 0, skill_errors: {} };
  if (!file || !fs.existsSync(file)) return out;
  const skills = new Map();
  const pending = new Map();
  let lastSkill = null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const content = row?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type === "tool_use") {
        out.tool_calls++;
        if (block.name === "Skill" && typeof block.input?.skill === "string") {
          const name = block.input.skill.split(":").pop();
          skills.set(name, (skills.get(name) || 0) + 1);
          lastSkill = name;
        }
        if (block.id) pending.set(block.id, lastSkill);
      } else if (toolError(block)) {
        out.tool_errors++;
        const owner = pending.get(block.tool_use_id);
        if (owner) out.skill_errors[owner] = (out.skill_errors[owner] || 0) + 1;
      }
    }
  }
  out.skills = [...skills.entries()].map(([name, uses]) => ({ name, uses }));
  return out;
}

export function status(root) {
  const events = readEvents(root, { sinceMs: WINDOW_MS });
  const sessions = events.filter((e) => e.kind === "session");
  const skills = new Map();
  for (const s of sessions) {
    for (const { name, uses } of s.skills || []) {
      const row = skills.get(name) || { name, sessions: 0, uses: 0, error_sessions: 0, errors: 0, event_ids: [] };
      row.sessions++;
      row.uses += uses;
      const errs = s.skill_errors?.[name] || 0;
      if (errs) {
        row.error_sessions++;
        row.errors += errs;
        row.event_ids.push(s.id);
      }
      skills.set(name, row);
    }
  }
  const guards = new Map();
  for (const g of events.filter((e) => e.kind === "guard")) {
    const row = guards.get(g.guard) || { guard: g.guard, hits: 0, decisions: {} };
    row.hits++;
    row.decisions[g.decision] = (row.decisions[g.decision] || 0) + 1;
    guards.set(g.guard, row);
  }
  return {
    window_days: WINDOW_MS / 86400000,
    sessions: sessions.length,
    skills: [...skills.values()].sort((a, b) => b.error_sessions - a.error_sessions || b.sessions - a.sessions),
    guards: [...guards.values()].sort((a, b) => b.hits - a.hits)
  };
}

export function nudges(root, { remember = true } = {}) {
  const s = status(root);
  let seen = {};
  try {
    seen = JSON.parse(fs.readFileSync(nudgedFile(root), "utf8"));
  } catch {
    seen = {};
  }
  const lines = [];
  for (const k of s.skills.filter((x) => x.error_sessions >= SKILL_ERROR_SESSIONS)) {
    const key = `skill:${k.name}:${k.event_ids.at(-1)}`;
    if (seen[key]) continue;
    seen[key] = new Date().toISOString();
    lines.push(`${k.name} hit tool errors in ${k.error_sessions} of its last ${k.sessions} sessions; review with /mk-dogfood --skill ${k.name} --evidence ${k.event_ids.slice(-SKILL_ERROR_SESSIONS).join(",")}`);
  }
  for (const g of s.guards.filter((x) => x.hits >= GUARD_HITS)) {
    const bucket = Math.floor(g.hits / GUARD_HITS);
    const key = `guard:${g.guard}:${bucket}`;
    if (seen[key]) continue;
    seen[key] = new Date().toISOString();
    lines.push(`the ${g.guard} guard fired ${g.hits} times in ${s.window_days} days; if agents keep needing it, state the rule in knowledge/synthesis/team-rules.md`);
  }
  if (remember && lines.length) {
    fs.mkdirSync(improveDir(root), { recursive: true });
    fs.writeFileSync(nudgedFile(root), `${JSON.stringify(seen, null, 2)}\n`);
  }
  return lines;
}
