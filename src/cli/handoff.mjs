import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs } from "./args.mjs";
import { findRoot, loadConfig } from "../core/config.mjs";
import { loadFeatures, logDir, parseLog } from "../core/harness/store.mjs";
import { readPlan, resolveCurrent } from "../plans/plans.mjs";
import { redact } from "../core/redact.mjs";

function git(cwd, args) {
  try {
    return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function repoFacts(dir) {
  const status = git(dir, ["status", "--porcelain"]);
  return {
    branch: git(dir, ["branch", "--show-current"]),
    head: git(dir, ["rev-parse", "--short", "HEAD"]),
    head_subject: redact(git(dir, ["log", "-1", "--format=%s"])),
    upstream: (() => {
      const [behind, ahead] = git(dir, ["rev-list", "--left-right", "--count", "@{upstream}...HEAD"]).split(/\s+/).map(Number);
      return Number.isFinite(behind) ? { behind, ahead } : null;
    })(),
    uncommitted: status ? status.split("\n").length : 0,
    uncommitted_files: status
      ? status
          .split("\n")
          .slice(0, 20)
          .map((l) => l.slice(3))
      : []
  };
}

export function collectFacts(cwd = process.cwd()) {
  const facts = { captured_at: new Date().toISOString(), cwd, repo: repoFacts(cwd), plan: null, knowledgebase: null };
  try {
    const plan = readPlan(resolveCurrent(cwd));
    const next = plan.phases.find((p) => p.meta.status !== "completed");
    facts.plan = { name: plan.name, dir: path.relative(cwd, plan.dir), status: plan.meta.status, feature: plan.meta.feature || null, progress: plan.progress, next_phase: next ? { number: next.number, title: next.meta.title, file: next.file, open_items: next.total - next.done } : null };
  } catch {
    facts.plan = null;
  }
  const root = findRoot(cwd);
  if (root) {
    const cfg = loadConfig(root);
    const features = loadFeatures(cfg)
      .map((f) => f.data)
      .filter(Boolean);
    const recent = [];
    const dir = logDir(cfg);
    if (fs.existsSync(dir)) {
      const months = fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}\.md$/.test(f)).sort();
      for (const m of months.slice(-2)) recent.push(...parseLog(fs.readFileSync(path.join(dir, m), "utf8")));
    }
    facts.knowledgebase = {
      root,
      project: cfg.project,
      active: features.filter((f) => f.state === "active").map((f) => ({ id: f.id, title: f.title, unknowns: f.unknowns || [] })),
      blocked: features.filter((f) => f.state === "blocked").map((f) => ({ id: f.id, title: f.title, blocker: f.blocker })),
      dirty_repos: cfg.repos.filter((r) => fs.existsSync(path.join(root, r.path)) && git(path.join(root, r.path), ["status", "--porcelain"])).map((r) => r.id),
      recent_log: recent.slice(-5).reverse().map((e) => `${e.date} ${e.kind}: ${redact(e.title)}`)
    };
  }
  return facts;
}

function markdown(f) {
  const lines = ["## Live state (from mk handoff)", "", `- Captured: ${f.captured_at}`, `- Repo: branch \`${f.repo.branch || "?"}\` at \`${f.repo.head || "?"}\` (${f.repo.head_subject || "no commits"})`, `- Uncommitted files: ${f.repo.uncommitted}${f.repo.uncommitted_files.length ? ` (${f.repo.uncommitted_files.map((x) => `\`${x}\``).join(", ")}${f.repo.uncommitted > 20 ? ", ..." : ""})` : ""}`];
  if (f.plan) {
    lines.push(`- Plan: \`${f.plan.dir}\` ${f.plan.status}, ${f.plan.progress.done}/${f.plan.progress.total} items${f.plan.feature ? `, delivers ${f.plan.feature}` : ""}`);
    if (f.plan.next_phase) lines.push(`- Next phase: ${f.plan.next_phase.number}. ${f.plan.next_phase.title} (\`${f.plan.next_phase.file}\`, ${f.plan.next_phase.open_items} open item(s))`);
  } else lines.push("- Plan: none resolved for this branch");
  if (f.knowledgebase) {
    const kb = f.knowledgebase;
    lines.push(`- Harness (${kb.project}): active ${kb.active.map((x) => x.id).join(", ") || "none"}; blocked ${kb.blocked.map((x) => `${x.id} (${x.blocker})`).join(", ") || "none"}`);
    if (kb.dirty_repos.length) lines.push(`- Repos with uncommitted changes: ${kb.dirty_repos.join(", ")}`);
    if (kb.recent_log.length) lines.push(`- Recent log: ${kb.recent_log.join("; ")}`);
  }
  return `${lines.join("\n")}\n`;
}

export default async function handoff(argv) {
  const o = parseArgs(argv, { flags: ["json"], options: [] });
  const f = collectFacts();
  console.log(o.flags.json ? JSON.stringify(f, null, 2) : markdown(f));
  return 0;
}
