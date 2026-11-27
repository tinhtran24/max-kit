import fs from "node:fs";
import path from "node:path";

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysSince(date) {
  return Math.floor((Date.now() - new Date(String(date)).getTime()) / 86400000);
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function existingDir(start) {
  let d = path.resolve(start);
  while (!fs.existsSync(d) && path.dirname(d) !== d) d = path.dirname(d);
  return fs.existsSync(d) && !fs.statSync(d).isDirectory() ? path.dirname(d) : d;
}

export function rel(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

export function walk(dir, ext, skip = ["node_modules", ".git", ".max-kit"]) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, ext, skip));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

export function result(name) {
  return { name, errors: [], warnings: [], notes: [] };
}

export const sameText = (a, b) => a !== null && a.replace(/\r\n/g, "\n") === b.replace(/\r\n/g, "\n");

export function writeOrCheck(file, content, check) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (sameText(current, content)) return { changed: false, ok: true };
  if (check) return { changed: true, ok: false };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return { changed: true, ok: true };
}

export function printResult(r) {
  for (const w of r.warnings) console.warn(`  warn: ${w}`);
  for (const e of r.errors) console.error(`  error: ${e}`);
  for (const n of r.notes) console.log(`  ${n}`);
  const status = r.errors.length ? `failed (${r.errors.length} error(s))` : `passed${r.warnings.length ? ` with ${r.warnings.length} warning(s)` : ""}`;
  console.log(`${r.name}: ${status}`);
  return r.errors.length === 0;
}

export function fill(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
