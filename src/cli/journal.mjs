import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { parseArgs } from "./args.mjs";
import { plansDir, readPlan, resolveCurrent, slugify } from "../plans/plans.mjs";
import { redact } from "../core/redact.mjs";

const MAX_BYTES = 64 * 1024;
const journalsDir = (cwd = process.cwd()) => process.env.MK_JOURNALS_DIR || path.join(plansDir(cwd), "journals");

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function split(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { meta: YAML.parse(m[1]) || {}, body: m[2] } : { meta: {}, body: text };
}

function entries() {
  const dir = journalsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{6}-\d{4}-.+\.md$/.test(f))
    .sort()
    .map((f) => ({ file: path.join(dir, f), stem: f.slice(0, -3), ...split(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

function find(ref) {
  const list = entries();
  const hits = list.filter((e) => e.stem === ref || e.stem.endsWith(`-${ref}`) || e.stem.includes(ref));
  if (hits.length === 1) return hits[0];
  throw new Error(hits.length ? `"${ref}" matches ${hits.length} entries: ${hits.map((e) => e.stem).join(", ")}` : `no journal entry matches "${ref}"`);
}

export function validateEntry(e) {
  const problems = [];
  for (const k of ["title", "date", "summary"]) if (!e.meta[k]) problems.push(`front matter ${k} missing`);
  if (!e.body.trim()) problems.push("body is empty");
  else if (!/^#{2,3} /m.test(e.body)) problems.push("body needs at least one ## section (what happened, decision, next steps)");
  if (redact(e.body) !== e.body) problems.push("body contains something that looks like a secret");
  if (Buffer.byteLength(e.body) > MAX_BYTES) problems.push(`body is over ${MAX_BYTES / 1024} KB; keep journals concise`);
  return problems;
}

async function readStdin() {
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const c of process.stdin) data += c;
  return data;
}

export default async function journal(argv) {
  const o = parseArgs(argv.slice(1), { flags: ["json", "stdin"], options: ["summary", "file", "limit"], multi: ["tag"] });
  const sub = argv[0];
  switch (sub) {
    case "create": {
      const title = o._[0];
      if (!title || !o.options.summary) throw new Error('usage: mk journal create "<title>" --summary "<one line>" (--stdin | --file <path>) [--tag t]');
      const raw = o.flags.stdin ? await readStdin() : o.options.file ? fs.readFileSync(o.options.file, "utf8") : "";
      if (!raw.trim()) throw new Error("journal body is empty: pass it with --stdin or --file");
      const body = redact(raw.replace(/\r\n/g, "\n")).trim();
      let plan = "";
      try {
        plan = readPlan(resolveCurrent()).name;
      } catch {
        plan = "";
      }
      const meta = { title, date: new Date().toISOString(), summary: o.options.summary, branch: git(["branch", "--show-current"]), commit: git(["rev-parse", "--short", "HEAD"]), ...(plan ? { plan } : {}), ...(o.options.tag.length ? { tags: o.options.tag } : {}) };
      const dir = journalsDir();
      fs.mkdirSync(dir, { recursive: true });
      let file = path.join(dir, `${stamp()}-${slugify(title)}.md`);
      for (let i = 2; fs.existsSync(file); i++) file = path.join(dir, `${stamp()}-${slugify(title)}-${i}.md`);
      fs.writeFileSync(file, `---\n${YAML.stringify(meta).trimEnd()}\n---\n\n# ${title}\n\n${body}\n`);
      const problems = validateEntry({ meta, body });
      if (body !== raw.replace(/\r\n/g, "\n").trim()) console.warn("warn: secrets were redacted from the body");
      for (const p of problems) console.warn(`warn: ${p}`);
      console.log(o.flags.json ? JSON.stringify({ file, stem: path.basename(file, ".md") }) : `wrote ${path.relative(process.cwd(), file)}`);
      return 0;
    }
    case "list": {
      const list = entries().reverse().slice(0, o.options.limit ? Number(o.options.limit) : undefined);
      if (o.flags.json) console.log(JSON.stringify(list.map((e) => ({ stem: e.stem, ...e.meta })), null, 2));
      else for (const e of list) console.log(`${e.stem.padEnd(48)} ${e.meta.summary || ""}`);
      return 0;
    }
    case "show": {
      const e = find(o._[0] || "");
      console.log(o.flags.json ? JSON.stringify({ stem: e.stem, ...e.meta, body: e.body }, null, 2) : fs.readFileSync(e.file, "utf8"));
      return 0;
    }
    case "validate": {
      const list = o._[0] ? [find(o._[0])] : entries();
      let bad = 0;
      for (const e of list) {
        const problems = validateEntry(e);
        if (problems.length) bad++;
        for (const p of problems) console.error(`  error: ${e.stem}: ${p}`);
      }
      console.log(`${list.length} entr${list.length === 1 ? "y" : "ies"} checked, ${bad} with problems`);
      return bad ? 1 : 0;
    }
    default:
      console.log(`usage: mk journal <command>

  create "<title>" --summary "<one line>" (--stdin | --file <path>) [--tag t]   write plans/journals/<stamp>-<slug>.md
  list [--limit N] [--json]      newest first
  show <slug> [--json]
  validate [<slug>]              front matter, a ## section, no secrets, under 64 KB

Body text is redacted before it is written. Journals are work history, not decision records.`);
      return sub ? 2 : 0;
  }
}
