import fs from "node:fs";
import path from "node:path";
import { bootContext } from "../../guards/boot.mjs";
import { result } from "../util.mjs";

const normalize = (s) =>
  s
    .replace(/^\s*(?:[-*]|\d+\.)\s+/, "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function bootCheck(cfg) {
  const r = result("boot budget");
  const ctx = bootContext(cfg);
  if (ctx.length > cfg.boot.maxChars) r.errors.push(`boot context is ${ctx.length} chars, budget ${cfg.boot.maxChars}; move situational rules into a skill or a repo instructions file`);
  else r.notes.push(`boot context ${ctx.length}/${cfg.boot.maxChars} chars`);

  for (const f of ["AGENTS.md", "CLAUDE.md"]) {
    const file = path.join(cfg.root, f);
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n").length;
    if (lines > cfg.boot.maxInstructionLines) r.errors.push(`${f} has ${lines} lines, budget ${cfg.boot.maxInstructionLines}; keep it a router`);
  }

  const seen = new Map();
  for (const relPath of cfg.boot.ruleFiles) {
    const file = path.join(cfg.root, relPath);
    if (!fs.existsSync(file)) {
      r.errors.push(`boot rule file missing: ${relPath}`);
      continue;
    }
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!/^\s*(?:[-*]|\d+\.)\s+/.test(line)) continue;
      const key = normalize(line);
      if (key.length < 50) continue;
      const prev = seen.get(key);
      if (prev && prev !== relPath) r.errors.push(`rule copied in ${prev} and ${relPath}: "${key.slice(0, 80)}..."; keep one source and link to it`);
      else seen.set(key, relPath);
    }
  }
  return r;
}
