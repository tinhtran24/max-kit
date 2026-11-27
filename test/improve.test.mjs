import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { handleHook } from "../src/cli/hook.mjs";
import { summariseTranscript } from "../src/improve/events.mjs";
import { editConfig, fixture, makeKb, tmpDir } from "./helpers.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "max-kit.mjs");
const mk = (cwd, ...args) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });

function transcript(dir, { skill, errors }) {
  const file = path.join(dir, `t-${Math.random().toString(36).slice(2)}.jsonl`);
  const rows = [
    { message: { content: [{ type: "text", text: "secret prompt text that must not be stored" }] } },
    { message: { content: [{ type: "tool_use", id: "s1", name: "Skill", input: { skill: `max-kit:${skill}` } }] } },
    ...Array.from({ length: errors }, (_, i) => ({ message: { content: [{ type: "tool_use", id: `b${i}`, name: "Bash", input: { command: "npm test" } }] } })),
    ...Array.from({ length: errors }, (_, i) => ({ message: { content: [{ type: "tool_result", tool_use_id: `b${i}`, is_error: true, content: "boom" }] } }))
  ];
  fs.writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n"));
  return file;
}

const stop = (kb, session, transcriptPath) =>
  handleHook("stop", "claude", JSON.stringify({ session_id: session, transcript_path: transcriptPath, cwd: kb, hook_event_name: "Stop", stop_hook_active: false }));
const session = (kb) => handleHook("session", "claude", fixture("claude", "session-start", { cwd: kb }));

test("transcripts are summarised as names and counts only", () => {
  const t = transcript(tmpDir("t"), { skill: "mk-fix", errors: 2 });
  const s = summariseTranscript(t);
  assert.deepEqual(s.skills, [{ name: "mk-fix", uses: 1 }]);
  assert.equal(s.tool_errors, 2);
  assert.deepEqual(s.skill_errors, { "mk-fix": 2 });
  assert.ok(!JSON.stringify(s).includes("secret prompt"));
  assert.deepEqual(summariseTranscript("/nope.jsonl").skills, []);
});

test("one record per session; repeated errors nudge once with evidence ids", async () => {
  const kb = await makeKb();
  const dir = tmpDir("t");
  for (const id of ["a", "a", "b", "c"]) await stop(kb, id, transcript(dir, { skill: "mk-fix", errors: 1 }));
  const s = JSON.parse(mk(kb, "improve", "status", "--json").stdout);
  assert.equal(s.sessions, 3, "the same session id is recorded once");
  assert.equal(s.skills[0].name, "mk-fix");
  assert.equal(s.skills[0].error_sessions, 3);
  const raw = fs.readFileSync(path.join(kb, ".max-kit/improve/sessions", fs.readdirSync(path.join(kb, ".max-kit/improve/sessions"))[0]), "utf8");
  assert.ok(!raw.includes("secret prompt") && !raw.includes("npm test"), "no content is stored");

  const first = JSON.parse((await session(kb)).stdout).hookSpecificOutput.additionalContext;
  assert.match(first, /max-kit improve:\n- mk-fix hit tool errors in 3 of its last 3 sessions; review with \/mk-dogfood --skill mk-fix --evidence [0-9a-f,]+/);
  const second = JSON.parse((await session(kb)).stdout).hookSpecificOutput.additionalContext;
  assert.doesNotMatch(second, /max-kit improve/, "a nudge is shown once");
});

test("guard hits are recorded and suggest a team rule after five", async () => {
  const kb = await makeKb();
  for (let i = 0; i < 5; i++) await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-bash", { cwd: kb, command: "git push origin main" }));
  const s = JSON.parse(mk(kb, "improve", "status", "--json").stdout);
  assert.deepEqual(s.guards, [{ guard: "branch", hits: 5, decisions: { deny: 5 } }]);
  assert.match(mk(kb, "improve", "nudge").stdout, /the branch guard fired 5 times/);
});

test("recording can be turned off, and clear needs --yes", async () => {
  const kb = await makeKb();
  editConfig(kb, (c) => (c.improve = { enabled: false }));
  await stop(kb, "x", transcript(tmpDir("t"), { skill: "mk-plan", errors: 0 }));
  await handleHook("pre-tool", "claude", fixture("claude", "pre-tool-bash", { cwd: kb, command: "git push origin main" }));
  assert.equal(fs.existsSync(path.join(kb, ".max-kit/improve")), false);
  assert.equal(mk(kb, "improve", "clear").status, 2);
  assert.equal(mk(kb, "improve", "clear", "--yes").status, 0);
});
