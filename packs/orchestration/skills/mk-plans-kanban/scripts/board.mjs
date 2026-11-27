#!/usr/bin/env node
// Usage: mk plan list --all --json | node board.mjs [--html <file>]
import fs from "node:fs";

const COLUMNS = ["pending", "in-progress", "completed", "cancelled"];
const plans = JSON.parse(fs.readFileSync(0, "utf8") || "[]");
const htmlOut = process.argv.includes("--html") ? process.argv[process.argv.indexOf("--html") + 1] : null;
const by = Object.fromEntries(COLUMNS.map((c) => [c, plans.filter((p) => (p.status || "pending") === c)]));
const label = (p) => `${p.title || p.name} (${p.progress?.percent ?? 0}%${p.feature ? `, ${p.feature}` : ""}${p.state && p.state !== "active" ? `, ${p.state}` : ""})`;

if (!htmlOut) {
  for (const c of COLUMNS) {
    console.log(`## ${c} (${by[c].length})\n`);
    for (const p of by[c]) console.log(`- ${label(p)}: \`${p.dir}\``);
    console.log("");
  }
} else {
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const cards = (c) => by[c].map((p) => `<li><strong>${esc(p.title || p.name)}</strong><span>${p.progress?.percent ?? 0}%${p.feature ? ` · ${esc(p.feature)}` : ""}</span><code>${esc(p.name)}</code></li>`).join("");
  fs.writeFileSync(
    htmlOut,
    `<!doctype html><meta charset="utf-8"><title>Plans</title><style>body{font:14px system-ui;margin:16px;background:#fafafa;color:#222}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}section{background:#fff;border:1px solid #ddd;border-radius:8px;padding:8px}h2{font-size:14px;margin:4px 0 8px}ul{list-style:none;margin:0;padding:0}li{border:1px solid #eee;border-radius:6px;padding:6px;margin-bottom:6px;display:grid;gap:2px}span{color:#666}code{font-size:11px;color:#888}@media (prefers-color-scheme:dark){body{background:#111;color:#eee}section{background:#1b1b1b;border-color:#333}li{border-color:#2a2a2a}}</style><main>${COLUMNS.map((c) => `<section><h2>${c} (${by[c].length})</h2><ul>${cards(c)}</ul></section>`).join("")}</main>\n`
  );
  console.log(`wrote ${htmlOut}`);
}
