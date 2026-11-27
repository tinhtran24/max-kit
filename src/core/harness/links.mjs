import fs from "node:fs";
import path from "node:path";
import { kb } from "../config.mjs";
import { rel, result, walk } from "../util.mjs";

const NO_README = new Set(["log", "templates"]);

export function lintLinks(cfg) {
  const r = result("links");
  const files = [...walk(kb(cfg), ".md"), ...["AGENTS.md", "CLAUDE.md", "README.md"].map((f) => path.join(cfg.root, f))].filter((f) => fs.existsSync(f));

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), decodeURI(target.split("#")[0]));
      if (!fs.existsSync(resolved)) r.errors.push(`${rel(cfg.root, file)}: broken link ${target}`);
    }
  }

  if (fs.existsSync(kb(cfg))) {
    for (const entry of fs.readdirSync(kb(cfg), { withFileTypes: true })) {
      if (!entry.isDirectory() || NO_README.has(entry.name)) continue;
      if (!["README.md", "index.md", "_index.md"].some((f) => fs.existsSync(kb(cfg, entry.name, f)))) {
        r.errors.push(`knowledge/${entry.name}/ has no README.md or index`);
      }
    }
  }
  r.notes.push(`${files.length} markdown file(s)`);
  return r;
}
