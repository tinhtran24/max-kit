import path from "node:path";
import { spawn } from "node:child_process";
import { underAgent } from "./agent.mjs";
import { audit } from "./audit.mjs";
import { consume, findGrant, request } from "./grants.mjs";
import { revealSecret, VaultError, REF_PATTERN } from "./vault.mjs";

const REF_IN_ARG = /\$\{secret:([A-Za-z0-9][A-Za-z0-9_.-]*)\}/g;

export function scopesFor(program, envPairs, args) {
  const prog = path.basename(program || "");
  const scopes = envPairs.map((pair) => {
    const i = pair.indexOf("=");
    if (i < 1) throw new VaultError(`--env needs VAR=REF, got "${pair}"`, 2);
    const env = pair.slice(0, i);
    const ref = pair.slice(i + 1);
    if (!REF_PATTERN.test(ref)) throw new VaultError(`invalid ref "${ref}"`, 2);
    return { ref, program: prog, env };
  });
  for (const a of args) for (const [, ref] of a.matchAll(REF_IN_ARG)) scopes.push({ ref, program: prog, env: "" });
  return scopes;
}

export function redactor(values) {
  const pairs = values.filter(([v]) => v && v.length >= 4).sort((a, b) => b[0].length - a[0].length);
  return (text) => {
    let out = text;
    for (const [v, ref] of pairs) out = out.split(v).join(`[redacted:${ref}]`);
    return out;
  };
}

function pipeRedacted(stream, sink, redact) {
  let buf = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buf += chunk;
    const cut = buf.lastIndexOf("\n");
    if (cut === -1) return;
    sink.write(redact(buf.slice(0, cut + 1)));
    buf = buf.slice(cut + 1);
  });
  return () => {
    if (buf) sink.write(redact(buf));
  };
}

export async function runWithSecrets({ program, args = [], envPairs = [], purpose = "", stdout = process.stdout, stderr = process.stderr }) {
  if (!program) throw new VaultError("usage: mk secrets run [--env VAR=REF]... -- <program> [args...]", 2);
  const scopes = scopesFor(program, envPairs, args);
  if (!scopes.length) throw new VaultError("nothing to inject: pass --env VAR=REF or use ${secret:REF} in an argument", 2);

  if (underAgent()) {
    const missing = scopes.filter((s) => !findGrant(s));
    if (missing.length) {
      const reqs = missing.map((s) => request(s, purpose));
      audit("run", { refs: scopes.map((s) => s.ref), program: scopes[0].program, decision: "pending" });
      throw new VaultError(
        `waiting for approval of ${reqs.map((r) => `${r.ref} (${r.env || "argument"} in ${r.program}, request ${r.id})`).join(", ")}. Ask the user to run \`mk secrets approve\` in their own terminal (not through the agent), then retry the same command.`,
        7
      );
    }
    for (const s of scopes) consume(s);
  }

  const values = new Map(scopes.map((s) => [s.ref, revealSecret(s.ref)]));
  const env = { ...process.env };
  for (const s of scopes) if (s.env) env[s.env] = values.get(s.ref);
  const finalArgs = args.map((a) => a.replace(REF_IN_ARG, (m, ref) => values.get(ref)));
  const redact = redactor([...values].map(([ref, v]) => [v, ref]));

  audit("run", { refs: scopes.map((s) => s.ref), program: scopes[0].program, decision: "allow" });
  return new Promise((resolve, reject) => {
    const child = spawn(program, finalArgs, { env, stdio: ["inherit", "pipe", "pipe"], shell: process.platform === "win32" && !/[\\/]/.test(program) });
    const flushOut = pipeRedacted(child.stdout, stdout, redact);
    const flushErr = pipeRedacted(child.stderr, stderr, redact);
    child.on("error", (e) => reject(new VaultError(`cannot start ${program}: ${e.message}`, 127)));
    child.on("close", (code, signal) => {
      flushOut();
      flushErr();
      resolve(code ?? (signal ? 128 : 1));
    });
  });
}
