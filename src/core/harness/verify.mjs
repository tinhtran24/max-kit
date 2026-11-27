import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { branchOf, headOf, isDirty } from "../git.mjs";
import { redact } from "../redact.mjs";
import { today } from "../util.mjs";
import { featuresDir, runsDir } from "./store.mjs";

const TAIL_LINES = 60;
const DEFAULT_TIMEOUT_S = 600;

export function normalizeCommands(verification = {}) {
  return (verification.commands || []).map((c) => (typeof c === "string" ? { run: c } : { ...c }));
}

function tail(text, n = TAIL_LINES) {
  const lines = String(text || "").replace(/\r\n/g, "\n").trimEnd().split("\n");
  return (lines.length > n ? [`... ${lines.length - n} earlier line(s) omitted`, ...lines.slice(-n)] : lines).join("\n");
}

function uniqueRunFile(cfg, slug, date) {
  const dir = runsDir(cfg);
  let file = path.join(dir, `${date}-${slug}.md`);
  for (let i = 2; fs.existsSync(file); i++) file = path.join(dir, `${date}-${slug}-${i}.md`);
  return file;
}

export function planVerify(cfg, id, { repo } = {}) {
  const file = path.join(featuresDir(cfg), `${id}.yml`);
  if (!fs.existsSync(file)) throw new Error(`unknown feature ${id}`);
  const doc = YAML.parseDocument(fs.readFileSync(file, "utf8"));
  const feature = doc.toJS();
  const commands = normalizeCommands(feature.verification);
  if (!commands.length) throw new Error(`${id} has no verification.commands; follow its protocol and record it with npm run new:run`);
  const repoIds = new Set(cfg.repos.map((r) => r.id));
  const steps = commands.map((c) => {
    const repoId = c.repo || repo || feature.repo || "";
    if (repoId && !repoIds.has(repoId)) throw new Error(`${id}: unknown repo "${repoId}"`);
    const r = cfg.repos.find((x) => x.id === repoId);
    return { ...c, repo: repoId || "knowledgebase", cwd: r ? path.join(cfg.root, r.path) : cfg.root };
  });
  const risky = cfg.guards.riskyCommands.map((p) => new RegExp(p, "im"));
  for (const s of steps) {
    const hit = risky.find((re) => re.test(s.run));
    if (hit) s.risky = hit.source;
  }
  return { file, doc, feature, steps };
}

export function runVerify(cfg, id, { repo, tier, allowRisky = false, timeoutSeconds = DEFAULT_TIMEOUT_S, log = () => {} } = {}) {
  const { file, doc, feature, steps } = planVerify(cfg, id, { repo });
  const blocked = steps.filter((s) => s.risky);
  if (blocked.length && !allowRisky) {
    throw new Error(`${id}: command matches a risky pattern (${blocked.map((s) => `"${s.run}"`).join(", ")}); confirm with the user, then rerun with --allow-risky`);
  }

  const results = [];
  for (const s of steps) {
    log(`$ ${redact(s.run)}   (${s.repo})`);
    const started = Date.now();
    const p = spawnSync(s.run, { cwd: s.cwd, shell: true, encoding: "utf8", timeout: timeoutSeconds * 1000, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: process.env.CI || "1" } });
    const exit = p.error?.code === "ETIMEDOUT" ? "timeout" : p.status ?? "signal";
    results.push({ ...s, exit, seconds: ((Date.now() - started) / 1000).toFixed(1), output: redact(tail(`${p.stdout || ""}${p.stderr ? `\n${p.stderr}` : ""}`)) });
    log(`  exit ${exit}`);
  }
  const passed = results.every((r) => r.exit === 0);

  const primary = results[0];
  const commit = headOf(primary.cwd);
  const date = today();
  const runFile = uniqueRunFile(cfg, `verify-${id.toLowerCase()}`, date);
  const covers = [...new Set(results.flatMap((r) => r.covers || []))];
  const front = {
    features: [id],
    date,
    result: passed ? "passed" : "failed",
    tier: tier || (feature.priority === "high" ? "high" : "low"),
    repo: primary.repo,
    commit,
    branch: branchOf(primary.cwd),
    dirty: isDirty(primary.cwd, primary.repo === "knowledgebase" ? ["knowledge"] : []),
    recorded_by: "max-kit verify",
    ...(covers.length ? { covers } : {})
  };
  const body = results
    .map(
      (r, i) => `### ${i + 1}. \`${redact(r.run)}\`

- Repo: ${r.repo}${r.covers?.length ? `\n- Covers: ${r.covers.join(", ")}` : ""}
- Exit: ${r.exit}, ${r.seconds}s

\`\`\`text
${r.output.replace(/```/g, "'''")}
\`\`\``
    )
    .join("\n\n");
  fs.mkdirSync(path.dirname(runFile), { recursive: true });
  fs.writeFileSync(
    runFile,
    `---
${YAML.stringify(front).trimEnd()}
---

# Run ${date}: verify ${id}

Recorded by \`max-kit verify\`. Output is the last ${TAIL_LINES} lines of each command, with secrets redacted.

## Expected

${feature.verification?.expected_result || ""}

## Commands

${body}

## Result

${passed ? "All commands exited 0." : `Failed: ${results.filter((r) => r.exit !== 0).map((r) => `\`${redact(r.run)}\``).join(", ")}.`}${front.dirty ? "\n\nThe repo had uncommitted changes; the commit above does not fully describe what was verified." : ""}
`
  );

  const runRel = `harness/runs/${path.basename(runFile)}`;
  const notes = [];
  doc.set("updated_at", date);
  if (passed) {
    const evidence = doc.get("evidence");
    if (evidence && YAML.isSeq(evidence)) {
      evidence.flow = false;
      evidence.add(runRel);
    } else doc.set("evidence", [runRel]);
    if (feature.unknowns?.length) notes.push(`not marked passing: ${feature.unknowns.length} open unknown(s) in ${id}`);
    else if (front.dirty) notes.push("not marked passing: the repo has uncommitted changes; commit, then verify again");
    else {
      doc.set("state", "passing");
      doc.set("last_verified_at", date);
      if (doc.has("blocker")) doc.delete("blocker");
    }
  } else if (feature.state === "passing") {
    doc.set("state", "active");
    notes.push(`${id} moved from passing to active because verification failed`);
  }
  fs.writeFileSync(file, doc.toString());
  return { passed, runFile, results, notes, state: doc.get("state") };
}
