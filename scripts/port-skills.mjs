#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../src/cli/args.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let PACKS = path.join(KIT, "packs");
let NOTICES = path.join(KIT, "THIRD_PARTY_NOTICES.md");
const TEXT = /\.(md|mdx|txt|json|ya?ml|js|cjs|mjs|ts|py|sh|html|css|toml)$/i;

const USAGE = `usage: node scripts/port-skills.mjs --source <skills dir> --prefix <source prefix, e.g. xx-> --cli <source cli name>
         --product <source product name> --config-dir <source config folder> [--agents <agents dir>]
         [--pack <id> | --skill <mk-name,...>] [--rename <old>=<new>,...] [--write] [--report <file>]

Without --write it only reports. With --write it copies the selected planned skills into their pack.`;

const EXACT = [
  [/^doctor\b/, "mk doctor"],
  [/^kit init\b/, "mk init"],
  [/^kit refresh\b/, "mk update"],
  [/^self-update\b/, "npm update max-kit && mk update"],
  [/^update\b(?! --)/, "mk update"],
  [/^journal create\b/, "mk log"],
  [/^secrets (set|get|describe|list|search|annotate|rotate|delete|rm|compare|import-env|export|run|request|approve|grants|revoke|audit|status)\b/, "mk secrets $1"],
  [/^secrets grant\b/, "mk secrets approve"],
  [/^config prefs (resolve|get|set|unset|validate)\b/, "mk prefs $1"],
  [/^plan (create|add-phase|list|search|show|status|check|uncheck|update|use|resolve|validate|close|archive)\b/, "mk plan $1"],
  [/^plan$/, "mk plan"]
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function packFor(mkName) {
  for (const id of fs.readdirSync(PACKS)) {
    const file = path.join(PACKS, id, "pack.json");
    if (!fs.existsSync(file)) continue;
    const meta = JSON.parse(fs.readFileSync(file, "utf8"));
    if ((meta.planned || []).includes(mkName) || (meta.skills || []).includes(mkName)) return { id, file, meta };
  }
  return null;
}

function agentPackFor(mkName) {
  for (const id of fs.readdirSync(PACKS)) {
    const file = path.join(PACKS, id, "pack.json");
    if (!fs.existsSync(file)) continue;
    const meta = JSON.parse(fs.readFileSync(file, "utf8"));
    if ((meta.plannedAgents || []).includes(mkName) || (meta.agents || []).includes(mkName)) return { id, file, meta };
  }
  return null;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export function transform(text, o) {
  const unmapped = [];
  let out = text.replace(new RegExp(`(^|[\\s\`'"(])${esc(o.cli)} ([a-z][a-z-]*(?: [a-z][a-z-]*){0,2})`, "gm"), (m, lead, sub) => {
    for (const [re, to] of EXACT) if (re.test(sub)) return `${lead}${sub.replace(re, to)}`;
    unmapped.push(sub.split(" ")[0]);
    return m;
  });
  out = out
    .replace(new RegExp(`(^|[^A-Za-z0-9_])${esc(o.prefix)}`, "g"), "$1mk-")
    .replace(new RegExp(esc(o.configDir), "g"), ".max-kit")
    .replace(new RegExp(esc(o.product), "gi"), "max-kit")
    .replace(/^license:\s*Proprietary.*\n/gm, "")
    .replace(/^(\s*author:\s*).+$/gm, "$1max-kit");
  for (const [from, to] of Object.entries(o.renames || {})) out = out.replace(new RegExp(`\\bmk-${esc(from)}\\b`, "g"), `mk-${to}`);
  return { out, unmapped };
}

function residuals(text, o) {
  const found = [];
  if (new RegExp(`(^|[^A-Za-z0-9_])${esc(o.prefix)}`).test(text)) found.push("prefix");
  if (new RegExp(esc(o.product), "i").test(text)) found.push("product");
  if (text.includes(o.configDir)) found.push("config-dir");
  if (new RegExp(`(^|[\\s\`'"(])${esc(o.cli)} [a-z]`, "m").test(text)) found.push("cli");
  if (/[A-Za-z0-9]max-kit|max-kit[A-Za-z0-9]/.test(text)) found.push("glued-rename");
  if (/\$CLAUDE_PROJECT_DIR\/\.claude\/(hooks|scripts)|\.claude\/(hooks|scripts)\//.test(text)) found.push("external-hook-path");
  return found;
}

function licenceAction(text, o) {
  const thirdParty = /MIT License|Apache License|Permission is hereby granted|Licensed under the Apache/i.test(text);
  if (!thirdParty) return { drop: true };
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((l) => /^\s*(MIT License|Apache License|Copyright \(c\)(?!.*All Rights Reserved))/i.test(l) && !new RegExp(esc(o.product), "i").test(l));
  const kept = (start > 0 ? lines.slice(start) : lines).join("\n").trim();
  return { drop: true, notice: kept.replace(new RegExp(esc(o.product), "g"), "max-kit") };
}

function main() {
  const a = parseArgs(process.argv.slice(2), { flags: ["write", "help"], options: ["source", "agents", "prefix", "cli", "product", "config-dir", "pack", "skill", "report", "rename", "packs-dir", "notices"] });
  const o = { source: a.options.source, agents: a.options.agents, prefix: a.options.prefix, cli: a.options.cli, product: a.options.product, configDir: a.options["config-dir"] };
  if (a.flags.help || !o.source || !o.prefix || !o.cli || !o.product || !o.configDir) {
    console.log(USAGE);
    return a.flags.help ? 0 : 2;
  }
  if (a.options["packs-dir"]) PACKS = path.resolve(a.options["packs-dir"]);
  if (a.options.notices) NOTICES = path.resolve(a.options.notices);
  const only = a.options.skill ? new Set(a.options.skill.split(",")) : null;
  o.renames = Object.fromEntries((a.options.rename || "").split(",").filter(Boolean).map((p) => p.split("=")));
  const report = { skills: [], agents: [], unplaced: [] };
  const notices = [];

  for (const dir of fs.readdirSync(o.source).sort()) {
    const src = path.join(o.source, dir);
    if (!fs.statSync(src).isDirectory() || !dir.startsWith(o.prefix)) continue;
    const short = dir.slice(o.prefix.length);
    const mkName = `mk-${o.renames[short] || short}`;
    const pack = packFor(mkName);
    if (!pack) {
      report.unplaced.push(mkName);
      continue;
    }
    if (a.options.pack && pack.id !== a.options.pack) continue;
    if (only && !only.has(mkName)) continue;

    const entry = { name: mkName, pack: pack.id, files: 0, kb: 0, unmapped: {}, residual: {}, notices: 0 };
    const dest = path.join(PACKS, pack.id, "skills", mkName);
    for (const file of walk(src)) {
      const relf = path.relative(src, file);
      const base = path.basename(file).toUpperCase();
      entry.kb += fs.statSync(file).size / 1024;
      if (/^(LICENSE|NOTICE)/.test(base)) {
        const act = licenceAction(fs.readFileSync(file, "utf8"), o);
        if (act.notice) {
          notices.push(`## ${mkName}${base.startsWith("NOTICE") ? " (notice)" : ""}\n\n\`\`\`text\n${act.notice}\n\`\`\`\n`);
          entry.notices++;
        }
        continue;
      }
      entry.files++;
      const target = path.join(dest, relf.split(o.prefix).join("mk-"));
      o.selfFrom = `mk-${short}`;
      o.selfTo = mkName;
      if (TEXT.test(file)) {
        const { out, unmapped } = transform(fs.readFileSync(file, "utf8"), o);
        for (const u of unmapped) entry.unmapped[u] = (entry.unmapped[u] || 0) + 1;
        for (const k of residuals(out, o)) entry.residual[k] = (entry.residual[k] || 0) + 1;
        if (a.flags.write) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, out);
        }
      } else if (a.flags.write) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(file, target);
      }
    }
    entry.kb = Math.round(entry.kb);
    report.skills.push(entry);
    if (a.flags.write) {
      const meta = JSON.parse(fs.readFileSync(pack.file, "utf8"));
      meta.planned = (meta.planned || []).filter((n) => n !== mkName);
      meta.skills = [...new Set([...(meta.skills || []), mkName])].sort();
      fs.writeFileSync(pack.file, `${JSON.stringify(meta, null, 2)}\n`);
    }
  }

  if (o.agents) {
    for (const f of fs.readdirSync(o.agents).filter((x) => x.endsWith(".md")).sort()) {
      const base = f.slice(0, -3);
      const mkName = `mk-${base}`;
      const pack = agentPackFor(mkName);
      if (!pack) {
        report.unplaced.push(`agent ${mkName}`);
        continue;
      }
      if (a.options.pack && pack.id !== a.options.pack) continue;
      if (only && !only.has(mkName)) continue;
      let { out, unmapped } = transform(fs.readFileSync(path.join(o.agents, f), "utf8"), o);
      out = out.replace(/^name:\s*.+$/m, `name: ${mkName}`);
      report.agents.push({ name: mkName, pack: pack.id, unmapped, residual: residuals(out, o) });
      if (a.flags.write) {
        const dest = path.join(PACKS, pack.id, "agents", `${mkName}.md`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, out);
        const meta = JSON.parse(fs.readFileSync(pack.file, "utf8"));
        meta.plannedAgents = (meta.plannedAgents || []).filter((n) => n !== mkName);
        meta.agents = [...new Set([...(meta.agents || []), mkName])].sort();
        fs.writeFileSync(pack.file, `${JSON.stringify(meta, null, 2)}\n`);
      }
    }
  }

  if (a.flags.write && notices.length) {
    const head = fs.existsSync(NOTICES) ? fs.readFileSync(NOTICES, "utf8") : "# Third-party notices\n\nSkills in max-kit include material from the projects below, under their own licences.\n";
    const fresh = notices.filter((n) => !head.includes(n.split("\n")[0] + "\n"));
    fs.writeFileSync(NOTICES, `${head.trimEnd()}\n\n${fresh.join("\n")}`);
  }

  const lines = [];
  const clean = report.skills.filter((s) => !Object.keys(s.unmapped).length && !Object.keys(s.residual).length);
  lines.push(`${a.flags.write ? "ported" : "would port"} ${report.skills.length} skill(s), ${report.agents.length} agent(s); ${clean.length} skill(s) need no manual rewrite`);
  for (const s of report.skills) {
    const um = Object.entries(s.unmapped).map(([k, v]) => `${k}x${v}`).join(" ");
    const rs = Object.entries(s.residual).map(([k, v]) => `${k}x${v}`).join(" ");
    lines.push(`${s.pack.padEnd(15)} ${s.name.padEnd(28)} ${String(s.kb).padStart(5)} KB  ${um ? `unmapped: ${um}  ` : ""}${rs ? `residual: ${rs}  ` : ""}${s.notices ? `third-party notices: ${s.notices}` : ""}`);
  }
  for (const ag of report.agents) lines.push(`${ag.pack.padEnd(15)} agent ${ag.name.padEnd(22)} ${ag.unmapped.length ? `unmapped: ${ag.unmapped.join(" ")}  ` : ""}${ag.residual.length ? `residual: ${ag.residual.join(" ")}` : ""}`);
  if (report.unplaced.length) lines.push(`not in any pack: ${report.unplaced.join(", ")}`);
  const text = lines.join("\n");
  if (a.options.report) fs.writeFileSync(a.options.report, `${text}\n`);
  console.log(text);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
