import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { kb } from "../config.mjs";
import { result } from "../util.mjs";
import { frontMatter, loadFeatures } from "./store.mjs";

function git(dir, args) {
  try {
    return { ok: true, out: execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() };
  } catch {
    return { ok: false, out: "" };
  }
}

function latestPassingRun(cfg, evidence) {
  const runs = (evidence || [])
    .filter((ref) => /^harness\/runs\/.+\.md$/.test(ref) && fs.existsSync(kb(cfg, ref)))
    .map((ref) => ({ ref, meta: frontMatter(fs.readFileSync(kb(cfg, ref), "utf8")) || {} }))
    .filter((r) => r.meta.result === "passed" && r.meta.commit)
    .sort((a, b) => String(a.meta.date).localeCompare(String(b.meta.date)) || a.ref.localeCompare(b.ref));
  return runs.at(-1);
}

export function checkFreshness(cfg) {
  const r = result("evidence freshness");
  const push = cfg.harness.staleEvidence === "error" ? r.errors : r.warnings;
  let checked = 0;
  for (const { name, data: f } of loadFeatures(cfg)) {
    if (!f || f.state !== "passing") continue;
    const run = latestPassingRun(cfg, f.evidence);
    if (!run) continue;
    const repo = cfg.repos.find((x) => x.id === run.meta.repo);
    const dir = repo ? path.join(cfg.root, repo.path) : run.meta.repo === "knowledgebase" || !run.meta.repo ? cfg.root : null;
    if (!dir || !fs.existsSync(dir)) continue;
    const commit = String(run.meta.commit);
    if (!git(dir, ["cat-file", "-e", `${commit}^{commit}`]).ok) {
      push.push(`features/${name}: evidence ${run.ref} names commit ${commit}, which is not in ${run.meta.repo || "the knowledgebase"} (fetch, or verify again)`);
      continue;
    }
    checked++;
    const watch = [].concat(f.watch || []);
    if (!watch.length) continue;
    const changed = git(dir, ["diff", "--name-only", `${commit}..HEAD`, "--", ...watch]).out.split("\n").filter(Boolean);
    if (changed.length) {
      const sample = changed.slice(0, 3).join(", ") + (changed.length > 3 ? ` and ${changed.length - 3} more` : "");
      push.push(`features/${name}: watched paths changed since the verified commit ${commit} (${sample}); run npm run verify -- ${f.id}`);
    }
  }
  r.notes.push(`${checked} passing feature(s) with a resolvable evidence commit`);
  return r;
}
