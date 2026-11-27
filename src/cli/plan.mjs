import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "./args.mjs";
import { findRoot, loadConfig } from "../core/config.mjs";
import { loadFeatures } from "../core/harness/store.mjs";
import { realPath, addPhase, createPlan, listPlans, locate, PlanError, readPlan, refresh, resolveCurrent, setChecks, updatePlan, usePlan, validatePlan, workspaceRoot } from "../plans/plans.mjs";

const USAGE = `usage: mk plan <command>

  create --title "<title>" [--slug s] [--phase "<name>"]... [--feature <ID>]   scaffold plans/<stamp>-<slug>/
  add-phase <plan> "<name>"                     append phase-NN-<name>.md
  list [words] [--all] [--json]                 active plans (--all includes closed and archived)
  show [<plan>] [--json]                        front matter, phases and checklist progress
  status [<plan>]                               progress summary
  check <phase-file> [--item N]                 tick one item (or all); phase status follows the boxes
  uncheck <phase-file> [--item N]
  update [<plan>] [--status s] [--feature ID] [--linked-pr N] [--issue N] [--branch b]
  use <plan>                                    set the current plan for this worktree
  resolve [--json]                              the current plan: pointer, else the one active plan on this branch
  validate [<plan>]                             file and phase invariants
  close [<plan>] | archive [<plan>]             set state closed or archived in plan.md (files are never moved)

<plan> is a plan folder, its name, or a unique part of it; omitted means the current plan.
The plan files are the only state: there is no index to rebuild.`;

const rel = (p) => path.relative(realPath(process.cwd()), realPath(p)) || ".";

function summary(plan) {
  const lines = [`${plan.name}  ${plan.meta.title || ""}`, `  status ${plan.meta.status || "pending"}, state ${plan.meta.state || "active"}, ${plan.progress.done}/${plan.progress.total} done (${plan.progress.percent}%)${plan.meta.feature ? `, feature ${plan.meta.feature}` : ""}${plan.meta.linked_pr ? `, PR #${plan.meta.linked_pr}` : ""}`];
  for (const p of plan.phases) lines.push(`  ${String(p.number).padStart(2)}. ${(p.meta.status || "pending").padEnd(11)} ${p.done}/${p.total}  ${p.meta.title || p.file}`);
  return lines.join("\n");
}

function featureState(id) {
  const root = findRoot();
  if (!root || !id) return null;
  const f = loadFeatures(loadConfig(root)).find((x) => x.data?.id === id);
  return f ? f.data.state : "missing";
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  const o = parseArgs(rest, { flags: ["json", "all"], options: ["title", "slug", "feature", "status", "linked-pr", "issue", "branch", "item"], multi: ["phase"] });
  const json = o.flags.json;
  switch (cmd) {
    case "create": {
      const plan = createPlan({ title: o.options.title, slug: o.options.slug, phases: o.options.phase, feature: o.options.feature });
      usePlan(plan.dir);
      console.log(json ? JSON.stringify({ dir: plan.dir, phases: plan.phases.map((p) => p.file) }, null, 2) : `created ${rel(plan.dir)} with ${plan.phases.length} phase(s); it is now the current plan`);
      return 0;
    }
    case "add-phase": {
      const [ref, title] = o._;
      if (!title) throw new PlanError('usage: mk plan add-phase <plan> "<name>"');
      console.log(`added ${addPhase(locate(ref), title)}`);
      return 0;
    }
    case "list":
    case "search": {
      const plans = listPlans(process.cwd(), { all: o.flags.all, words: o._ });
      if (json) console.log(JSON.stringify(plans.map((p) => ({ dir: p.dir, name: p.name, ...p.meta, progress: p.progress })), null, 2));
      else for (const p of plans) console.log(`${p.name.padEnd(44)} ${(p.meta.status || "pending").padEnd(11)} ${String(p.progress.percent).padStart(3)}%  ${p.meta.title || ""}`);
      return 0;
    }
    case "show":
    case "status": {
      const plan = refresh(locate(o._[0]));
      if (json) console.log(JSON.stringify({ dir: plan.dir, meta: plan.meta, progress: plan.progress, phases: plan.phases.map(({ body, ...p }) => p) }, null, 2));
      else console.log(summary(plan));
      return 0;
    }
    case "check":
    case "uncheck": {
      const file = o._[0];
      if (!file || !fs.existsSync(file)) throw new PlanError(`usage: mk plan ${cmd} <phase-file> [--item N]`);
      const n = setChecks(path.resolve(file), { item: o.options.item ? Number(o.options.item) : undefined, value: cmd === "check" });
      console.log(`${cmd === "check" ? "checked" : "unchecked"} ${n} item(s) in ${path.basename(file)}`);
      return 0;
    }
    case "update": {
      const dir = locate(o._[0]);
      const plan = updatePlan(dir, { status: o.options.status, feature: o.options.feature, linked_pr: o.options["linked-pr"] ? Number(o.options["linked-pr"]) : undefined, issue: o.options.issue ? Number(o.options.issue) : undefined, branch: o.options.branch });
      if (o.options.status === "completed") {
        if (plan.progress.done < plan.progress.total) console.warn(`warn: ${plan.progress.total - plan.progress.done} checklist item(s) are still open`);
        const state = featureState(plan.meta.feature);
        if (state && state !== "passing") console.warn(`warn: linked feature ${plan.meta.feature} is ${state}; run mk verify ${plan.meta.feature}`);
      }
      console.log(`updated ${plan.name}`);
      return 0;
    }
    case "use": {
      const dir = locate(o._[0]);
      usePlan(dir);
      console.log(`current plan: ${path.relative(workspaceRoot(), dir)}`);
      return 0;
    }
    case "resolve": {
      const dir = resolveCurrent();
      console.log(json ? JSON.stringify({ dir, name: path.basename(dir), ...readPlan(dir).meta }, null, 2) : rel(dir));
      return 0;
    }
    case "validate": {
      const dir = locate(o._[0]);
      const problems = validatePlan(dir);
      for (const p of problems) console.error(`  error: ${p}`);
      console.log(`${path.basename(dir)}: ${problems.length ? `${problems.length} problem(s)` : "valid"}`);
      return problems.length ? 1 : 0;
    }
    case "close":
    case "archive": {
      const plan = updatePlan(locate(o._[0]), { state: cmd === "close" ? "closed" : "archived" });
      console.log(`${plan.name}: state ${plan.meta.state}; files kept`);
      return 0;
    }
    default:
      console.log(USAGE);
      return cmd ? 2 : 0;
  }
}

export default async function plan(argv) {
  try {
    return await main(argv);
  } catch (e) {
    if (e instanceof PlanError) {
      console.error(`mk plan: ${e.message}`);
      return e.code;
    }
    throw e;
  }
}
