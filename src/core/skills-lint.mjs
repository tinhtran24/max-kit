import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT } from "./config.mjs";
import { result, walk } from "./util.mjs";
import { listPacks, loadPack } from "./model.mjs";
import { COMMAND_NAMES } from "../cli/commands.mjs";

const TEXT = /\.(md|mdx|txt|json|ya?ml|js|cjs|mjs|ts|py|sh|html|css|toml)$/i;
const DEFAULT_MAX_KB = 512;

function frontMatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const field = (k) => m[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].trim().replace(/^["']|["']$/g, "") || "";
  return { name: field("name"), description: field("description") };
}

function dirSize(dir) {
  return walk(dir, "").reduce((n, f) => n + fs.statSync(f).size, 0);
}

function forbiddenPatterns() {
  return (process.env.MK_SKILLS_FORBIDDEN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new RegExp(s, "i"));
}

export function lintSkills(root = KIT_ROOT) {
  const r = result("skills lint");
  const forbidden = forbiddenPatterns();
  const names = new Map();
  const units = [{ pack: null, skillsDir: path.join(root, "skills"), agentsDir: path.join(root, "agents"), meta: {} }];
  for (const id of listPacks()) {
    const p = loadPack(id);
    units.push({ pack: id, skillsDir: path.join(p.dir, "skills"), agentsDir: path.join(p.dir, "agents"), meta: p.meta });
    if (!p.meta.description) r.errors.push(`packs/${id}/pack.json: description is required`);
  }

  const known = new Set();
  const ported = new Set();
  for (const id of listPacks()) {
    const m = loadPack(id).meta;
    for (const n of [...(m.skills || []), ...(m.agents || [])]) {
      known.add(n);
      ported.add(n);
    }
    for (const n of [...(m.planned || []), ...(m.plannedAgents || [])]) known.add(n);
  }
  const unresolved = new Map();
  let count = 0;
  for (const u of units) {
    const where = u.pack ? `packs/${u.pack}` : "";
    const listed = new Set(u.meta.skills || []);
    const present = fs.existsSync(u.skillsDir) ? fs.readdirSync(u.skillsDir).filter((d) => fs.statSync(path.join(u.skillsDir, d)).isDirectory()) : [];
    if (u.pack) {
      for (const s of listed) if (!present.includes(s)) r.errors.push(`${where}: pack.json lists ${s} but packs/${u.pack}/skills/${s} is missing`);
      for (const s of present) if (!listed.has(s)) r.errors.push(`${where}: skills/${s} is not listed in pack.json`);
    }
    for (const name of present) {
      count++;
      const dir = path.join(u.skillsDir, name);
      const at = `${where ? `${where}/` : ""}skills/${name}`;
      const file = path.join(dir, "SKILL.md");
      if (!fs.existsSync(file)) {
        r.errors.push(`${at}: SKILL.md missing`);
        continue;
      }
      const text = fs.readFileSync(file, "utf8");
      const fm = frontMatter(text);
      if (!fm) r.errors.push(`${at}: front matter missing`);
      else {
        if (fm.name !== name) r.errors.push(`${at}: front matter name "${fm.name}" must equal the folder name`);
        if (!fm.description) r.errors.push(`${at}: description is required`);
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) r.errors.push(`${at}: name must be lower-case kebab, at most 64 characters`);
        if (fm.description.length > 1024) r.errors.push(`${at}: description is ${fm.description.length} characters, limit 1024`);
      }
      if (u.pack && !name.startsWith("mk-")) r.errors.push(`${at}: pack skill names start with mk-`);
      if (names.has(name)) r.errors.push(`${at}: name also used by ${names.get(name)}`);
      names.set(name, at);

      const maxKb = u.meta.maxSkillKb?.[name] ?? DEFAULT_MAX_KB;
      const kb = Math.round(dirSize(dir) / 1024);
      if (kb > maxKb) r.errors.push(`${at}: ${kb} KB, budget ${maxKb} KB (set maxSkillKb in pack.json to allow it)`);

      for (const f of walk(dir, "").filter((x) => TEXT.test(x))) {
        const body = fs.readFileSync(f, "utf8");
        const relf = path.relative(dir, f).split(path.sep).join("/");
        for (const re of forbidden) if (re.test(body)) r.errors.push(`${at}/${relf}: contains a forbidden source name (${re.source})`);
        if (f.endsWith(".md")) {
          const plain = body.replace(/```[\s\S]*?```/g, "");
          for (const [, target] of plain.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
            if (/^(https?:|mailto:|#)/.test(target)) continue;
            if (!fs.existsSync(path.resolve(path.dirname(f), decodeURI(target.split("#")[0])))) r.errors.push(`${at}/${relf}: broken link ${target}`);
          }
        }
        for (const [, ref] of body.matchAll(/(?<![\w/.-])(mk-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w/-]|\.[a-z0-9])/g)) {
          if (ref === name || ported.has(ref)) continue;
          if (!known.has(ref)) r.errors.push(`${at}/${relf}: refers to ${ref}, which is not a max-kit skill or agent`);
          else unresolved.set(ref, (unresolved.get(ref) || new Set()).add(name));
        }
        const code = [...body.matchAll(/```[\s\S]*?```|`[^`\n]+`/g)].map((m) => m[0]).join("\n");
        for (const [, cmd] of code.matchAll(/(?:^|[\s`'"(;&|])(?:mk|max-kit) ([a-z][a-z-]*)\b/gm)) {
          if (!COMMAND_NAMES.includes(cmd)) r.errors.push(`${at}/${relf}: mentions "mk ${cmd}", which is not a max-kit command`);
        }
      }
    }
    if (fs.existsSync(u.agentsDir)) {
      for (const f of fs.readdirSync(u.agentsDir).filter((x) => x.endsWith(".md"))) {
        const at = `${where ? `${where}/` : ""}agents/${f}`;
        const body = fs.readFileSync(path.join(u.agentsDir, f), "utf8");
        const fm = frontMatter(body);
        if (!fm?.name || !fm.description) r.errors.push(`${at}: front matter needs name and description`);
        else if (`${fm.name}.md` !== f) r.errors.push(`${at}: name "${fm.name}" must equal the file name`);
        if (u.pack && fm?.name && !fm.name.startsWith("mk-")) r.errors.push(`${at}: pack agent names start with mk-`);
        for (const re of forbidden) if (re.test(body)) r.errors.push(`${at}: contains a forbidden source name (${re.source})`);
      }
    }
  }
  for (const [ref, from] of unresolved) r.warnings.push(`${ref} is planned but not ported yet; referenced by ${[...from].join(", ")}`);
  r.notes.push(`${count} skill(s) in core and ${units.length - 1} pack(s)${forbidden.length ? `, ${forbidden.length} forbidden pattern(s)` : ""}`);
  return r;
}
