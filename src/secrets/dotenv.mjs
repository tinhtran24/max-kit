import fs from "node:fs";
import path from "node:path";

const SKIP = /\.(example|sample|template|dist|bak|backup|orig|swp)$|~$/i;

export function parseDotenv(text) {
  const out = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (/^"/.test(v)) v = v.replace(/^"((?:[^"\\]|\\.)*)".*$/, "$1").replace(/\\n/g, "\n").replace(/\\(["\\])/g, "$1");
    else if (/^'/.test(v)) v = v.replace(/^'([^']*)'.*$/, "$1");
    else v = v.replace(/\s+#.*$/, "").trim();
    out.push({ key: m[1], value: v });
  }
  return out;
}

export function envFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs
    .readdirSync(target)
    .filter((f) => /^\.env(\..+)?$/.test(f) && !SKIP.test(f))
    .sort()
    .map((f) => path.join(target, f));
}

export function environmentOf(file) {
  const m = path.basename(file).match(/^\.env\.(.+)$/);
  return m ? m[1] : "default";
}

export function refFor(project, key, environment, multipleEnvs) {
  const base = `${project ? `${project.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_` : ""}${key}`;
  return multipleEnvs && environment !== "default" ? `${base}_${environment.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}` : base;
}
