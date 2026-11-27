#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKS = process.env.MAX_KIT_PACKS_DIR || path.join(KIT, "packs");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const isText = (file) => {
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(8192);
  const n = fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  return !buf.subarray(0, n).includes(0);
};

export function renameSkill(from, to, { packs = PACKS } = {}) {
  for (const n of [from, to]) if (!/^mk-[a-z0-9]+(-[a-z0-9]+)*$/.test(n)) throw new Error(`${n}: names are mk-<kebab>`);
  const re = new RegExp(`(?<![\\w.-])${esc(from)}(?![\\w-])`, "g");
  let files = 0;
  let manifests = 0;
  for (const id of fs.readdirSync(packs)) {
    const manifest = path.join(packs, id, "pack.json");
    if (!fs.existsSync(manifest)) continue;
    const meta = JSON.parse(fs.readFileSync(manifest, "utf8"));
    if (["skills", "planned", "agents", "plannedAgents"].some((k) => meta[k]?.includes(to))) throw new Error(`${to} already exists in packs/${id}`);
  }
  for (const id of fs.readdirSync(packs)) {
    const manifest = path.join(packs, id, "pack.json");
    if (!fs.existsSync(manifest)) continue;
    const meta = JSON.parse(fs.readFileSync(manifest, "utf8"));
    let touched = false;
    for (const key of ["skills", "planned", "agents", "plannedAgents"]) {
      if (!meta[key]?.includes(from)) continue;
      meta[key] = meta[key].map((n) => (n === from ? to : n)).sort();
      touched = true;
    }
    if (meta.maxSkillKb?.[from] !== undefined) {
      meta.maxSkillKb[to] = meta.maxSkillKb[from];
      delete meta.maxSkillKb[from];
      touched = true;
    }
    if (touched) {
      fs.writeFileSync(manifest, `${JSON.stringify(meta, null, 2)}\n`);
      manifests++;
    }
    const skillDir = path.join(packs, id, "skills", from);
    if (fs.existsSync(skillDir)) fs.renameSync(skillDir, path.join(packs, id, "skills", to));
    const agentFile = path.join(packs, id, "agents", `${from}.md`);
    if (fs.existsSync(agentFile)) fs.renameSync(agentFile, path.join(packs, id, "agents", `${to}.md`));
  }
  for (const file of walk(packs)) {
    if (file.endsWith("pack.json") || !isText(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const next = text.replace(re, to).replace(new RegExp(`^name:\\s*${esc(from)}\\s*$`, "m"), `name: ${to}`);
    if (next !== text) {
      fs.writeFileSync(file, next);
      files++;
    }
  }
  return { files, manifests };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pairs = process.argv.slice(2);
  if (!pairs.length || pairs.some((p) => !p.includes("="))) {
    console.error("usage: node scripts/rename-skill.mjs mk-old=mk-new [...]");
    process.exit(2);
  }
  for (const p of pairs) {
    const [from, to] = p.split("=");
    const r = renameSkill(from, to);
    console.log(`${from} -> ${to}: ${r.manifests} pack manifest(s), ${r.files} file(s)`);
  }
}
