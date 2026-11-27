import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";

export const PLAN_STATUSES = ["pending", "in-progress", "completed", "cancelled"];
export const PHASE_STATUSES = ["pending", "in-progress", "completed"];
const PHASES_START = "<!-- mk:phases:start -->";
const PHASES_END = "<!-- mk:phases:end -->";

export class PlanError extends Error {
  constructor(message, code = 2) {
    super(message);
    this.code = code;
  }
}

function git(cwd, args) {
  try {
    return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export const realPath = (p) => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
};
export const workspaceRoot = (cwd = process.cwd()) => realPath(git(cwd, ["rev-parse", "--show-toplevel"]) || cwd);
export const plansDir = (cwd = process.cwd()) => process.env.MK_PLANS_DIR || path.join(workspaceRoot(cwd), "plans");
const pointerFile = (cwd) => {
  const gitDir = git(cwd, ["rev-parse", "--absolute-git-dir"]);
  return gitDir ? path.join(gitDir, "max-kit-current-plan") : path.join(workspaceRoot(cwd), ".max-kit", "current-plan");
};

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function split(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { meta: YAML.parse(m[1]) || {}, body: m[2] } : { meta: {}, body: text };
}

const join = (meta, body) => `---\n${YAML.stringify(meta).trimEnd()}\n---\n${body.startsWith("\n") ? body : `\n${body}`}`;

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function phaseFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^phase-\d+-[a-z0-9-]+\.md$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
}

function checklist(body) {
  const items = [...body.matchAll(/^\s*[-*] \[( |x|X)\] (.+)$/gm)];
  return { done: items.filter((m) => m[1] !== " ").length, total: items.length };
}

export function readPhase(dir, file) {
  const { meta, body } = split(fs.readFileSync(path.join(dir, file), "utf8"));
  return { file, number: Number(file.match(/\d+/)[0]), meta, body, ...checklist(body) };
}

export function readPlan(dir) {
  const file = path.join(dir, "plan.md");
  if (!fs.existsSync(file)) throw new PlanError(`${dir} has no plan.md`, 5);
  const { meta, body } = split(fs.readFileSync(file, "utf8"));
  const phases = phaseFiles(dir).map((f) => readPhase(dir, f));
  const done = phases.reduce((n, p) => n + p.done, 0);
  const total = phases.reduce((n, p) => n + p.total, 0);
  return { dir, name: path.basename(dir), meta, body, phases, progress: { done, total, percent: total ? Math.round((done / total) * 100) : 0 } };
}

function phasesTable(plan) {
  const rows = plan.phases.map((p) => `| ${p.number} | [${p.meta.title || p.file}](${p.file}) | ${p.meta.status || "pending"} | ${p.done}/${p.total} |`);
  return `${PHASES_START}\n| # | Phase | Status | Done |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n${PHASES_END}`;
}

export function refresh(dir) {
  const plan = readPlan(dir);
  for (const p of plan.phases) {
    const status = p.total && p.done === p.total ? "completed" : p.done ? "in-progress" : p.meta.status === "in-progress" ? "in-progress" : "pending";
    if (status !== p.meta.status) fs.writeFileSync(path.join(dir, p.file), join({ ...p.meta, status }, p.body));
  }
  const fresh = readPlan(dir);
  const table = phasesTable(fresh);
  const body = fresh.body.includes(PHASES_START) ? fresh.body.replace(new RegExp(`${PHASES_START}[\\s\\S]*?${PHASES_END}`), table) : `${fresh.body.trimEnd()}\n\n## Phases\n\n${table}\n`;
  fs.writeFileSync(path.join(dir, "plan.md"), join(fresh.meta, body));
  return readPlan(dir);
}

function phaseTemplate(n, title) {
  return join(
    { phase: n, title, status: "pending", priority: "P2", effort: "", dependencies: [] },
    `\n# Phase ${n}: ${title}\n\n## Goal\n\nOne sentence: what this phase accomplishes.\n\n## Files to create or modify\n\n- \n\n## Tasks\n\n- [ ] First concrete step\n\n## Verification\n\n- Command and expected result\n`
  );
}

export function createPlan({ title, slug, phases = [], feature = "", cwd = process.cwd() }) {
  if (!title) throw new PlanError("a plan needs --title");
  const dir = path.join(plansDir(cwd), `${stamp()}-${slugify(slug || title)}`);
  if (fs.existsSync(dir)) throw new PlanError(`${dir} already exists`, 4);
  fs.mkdirSync(dir, { recursive: true });
  const meta = { title, status: "pending", state: "active", created: new Date().toISOString().slice(0, 10), branch: git(cwd, ["branch", "--show-current"]) || "", ...(feature ? { feature } : {}) };
  fs.writeFileSync(
    path.join(dir, "plan.md"),
    join(meta, `\n# ${title}\n\n## Outcome\n\nWhat is true when this plan is done.\n\n## Constraints and non-goals\n\n- \n\n## Acceptance criteria\n\n- [ ] \n`)
  );
  phases.forEach((t, i) => fs.writeFileSync(path.join(dir, `phase-${String(i + 1).padStart(2, "0")}-${slugify(t)}.md`), phaseTemplate(i + 1, t)));
  return refresh(dir);
}

export function addPhase(dir, title) {
  const n = phaseFiles(dir).length ? Math.max(...phaseFiles(dir).map((f) => Number(f.match(/\d+/)[0]))) + 1 : 1;
  const file = `phase-${String(n).padStart(2, "0")}-${slugify(title)}.md`;
  fs.writeFileSync(path.join(dir, file), phaseTemplate(n, title));
  refresh(dir);
  return file;
}

export function listPlans(cwd = process.cwd(), { all = false, words = [] } = {}) {
  const root = plansDir(cwd);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((d) => fs.existsSync(path.join(root, d, "plan.md")))
    .sort()
    .map((d) => readPlan(path.join(root, d)))
    .filter((p) => all || (p.meta.state || "active") === "active")
    .filter((p) => words.every((w) => `${p.name} ${p.meta.title} ${p.body}`.toLowerCase().includes(w.toLowerCase())));
}

export function locate(ref, cwd = process.cwd()) {
  if (!ref) return resolveCurrent(cwd);
  const direct = path.resolve(cwd, ref);
  if (fs.existsSync(path.join(direct, "plan.md"))) return direct;
  if (fs.existsSync(direct) && path.basename(direct).startsWith("phase-")) return path.dirname(direct);
  const matches = listPlans(cwd, { all: true }).filter((p) => p.name === ref || p.name.endsWith(`-${ref}`) || p.name.includes(ref));
  if (matches.length === 1) return matches[0].dir;
  if (!matches.length) throw new PlanError(`no plan matches "${ref}"`, 5);
  throw new PlanError(`"${ref}" matches ${matches.length} plans: ${matches.map((p) => p.name).join(", ")}`, 3);
}

export function usePlan(dir, cwd = process.cwd()) {
  const f = pointerFile(cwd);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, `${path.relative(workspaceRoot(cwd), dir)}\n`);
}

export function resolveCurrent(cwd = process.cwd()) {
  const f = pointerFile(cwd);
  if (fs.existsSync(f)) {
    const dir = path.resolve(workspaceRoot(cwd), fs.readFileSync(f, "utf8").trim());
    if (fs.existsSync(path.join(dir, "plan.md")) && (readPlan(dir).meta.state || "active") === "active") return dir;
  }
  const branch = git(cwd, ["branch", "--show-current"]);
  const open = listPlans(cwd).filter((p) => !["completed", "cancelled"].includes(p.meta.status));
  const onBranch = open.filter((p) => branch && p.meta.branch === branch);
  const pick = onBranch.length ? onBranch : open.filter((p) => !p.meta.branch);
  if (pick.length === 1) return pick[0].dir;
  if (!pick.length) throw new PlanError("no active plan for this branch; pass a plan or run mk plan use <plan>", 1);
  throw new PlanError(`several active plans match: ${pick.map((p) => p.name).join(", ")}; run mk plan use <plan>`, 3);
}

export function setChecks(phasePath, { item, value }) {
  const text = fs.readFileSync(phasePath, "utf8");
  let i = 0;
  let changed = 0;
  const next = text.replace(/^(\s*[-*] )\[( |x|X)\]( .+)$/gm, (m, a, mark, rest) => {
    i++;
    if (item && i !== item) return m;
    const want = value ? "x" : " ";
    if ((mark !== " ") === value) return m;
    changed++;
    return `${a}[${want}]${rest}`;
  });
  if (item && item > i) throw new PlanError(`phase has ${i} checklist item(s); no item ${item}`);
  fs.writeFileSync(phasePath, next);
  refresh(path.dirname(phasePath));
  return changed;
}

export function updatePlan(dir, changes) {
  const file = path.join(dir, "plan.md");
  const { meta, body } = split(fs.readFileSync(file, "utf8"));
  if (changes.status && !PLAN_STATUSES.includes(changes.status)) throw new PlanError(`status must be one of ${PLAN_STATUSES.join(", ")}`);
  const next = { ...meta };
  for (const [k, v] of Object.entries(changes)) if (v !== undefined) next[k] = v;
  fs.writeFileSync(file, join(next, body));
  return readPlan(dir);
}

export function validatePlan(dir) {
  const problems = [];
  const plan = readPlan(dir);
  if (!plan.meta.title) problems.push("plan.md: title missing");
  if (plan.meta.status && !PLAN_STATUSES.includes(plan.meta.status)) problems.push(`plan.md: status must be one of ${PLAN_STATUSES.join(", ")}`);
  for (const f of fs.readdirSync(dir).filter((x) => /^phase-/.test(x) && x.endsWith(".md"))) {
    if (!/^phase-\d{2,}-[a-z0-9-]+\.md$/.test(f)) problems.push(`${f}: name must be phase-NN-<name>.md (whole numbers, no letter suffix)`);
  }
  const numbers = plan.phases.map((p) => p.number);
  numbers.forEach((n, i) => {
    if (n !== i + 1) problems.push(`phase numbers must run 1..${numbers.length} without gaps (found ${numbers.join(", ")})`);
  });
  for (const p of plan.phases) {
    if (p.meta.phase !== p.number) problems.push(`${p.file}: front matter phase ${p.meta.phase} does not match the file number`);
    if (!p.meta.title) problems.push(`${p.file}: title missing`);
    if (p.meta.status && !PHASE_STATUSES.includes(p.meta.status)) problems.push(`${p.file}: status must be one of ${PHASE_STATUSES.join(", ")}`);
    if (!p.total) problems.push(`${p.file}: no checklist items`);
    if (!/^## Verification/m.test(p.body)) problems.push(`${p.file}: Verification section missing`);
    for (const dep of p.meta.dependencies || []) if (!numbers.includes(Number(dep))) problems.push(`${p.file}: depends on unknown phase ${dep}`);
  }
  if (plan.meta.status === "completed" && plan.progress.done < plan.progress.total) problems.push(`plan.md: status completed but ${plan.progress.total - plan.progress.done} item(s) unchecked`);
  return [...new Set(problems)];
}
