import fs from "node:fs";
import path from "node:path";
import { kb } from "../config.mjs";
import { headOf } from "../git.mjs";
import { fill, today } from "../util.mjs";
import { featuresDir, runsDir, TRIGGERS } from "./store.mjs";

const template = (cfg, name) => fs.readFileSync(kb(cfg, "templates", name), "utf8");

export function newFeature(cfg, { id, title, area, trigger = "user_request" }) {
  if (!id || !title || !area) throw new Error('usage: new feature <ID> "<title>" <area> [trigger]');
  if (!new RegExp(cfg.harness.idPattern).test(id)) throw new Error(`id ${id} does not match ${cfg.harness.idPattern}`);
  if (!TRIGGERS.includes(trigger)) throw new Error(`trigger must be one of ${TRIGGERS.join(", ")}`);
  const file = path.join(featuresDir(cfg), `${id}.yml`);
  if (fs.existsSync(file)) throw new Error(`${id} already exists`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, fill(template(cfg, "feature.yml"), { id, title: title.replace(/"/g, '\\"'), area, trigger, date: today() }));
  return file;
}

export function newRun(cfg, { ids, slug, repo }) {
  if (!ids?.length || !slug) throw new Error("usage: new run <ID[,ID]> <slug> [--repo <id>]");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("slug must be lower-case kebab");
  const known = new Set(fs.existsSync(featuresDir(cfg)) ? fs.readdirSync(featuresDir(cfg)).map((f) => f.replace(/\.yml$/, "")) : []);
  for (const id of ids) if (!known.has(id)) throw new Error(`unknown feature ${id}`);
  const target = repo ? cfg.repos.find((r) => r.id === repo) : cfg.repos[0];
  if (repo && !target) throw new Error(`unknown repo ${repo}`);
  const commit = headOf(target ? path.join(cfg.root, target.path) : cfg.root);
  const date = today();
  const file = path.join(runsDir(cfg), `${date}-${slug}.md`);
  if (fs.existsSync(file)) throw new Error(`${path.basename(file)} already exists`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, fill(template(cfg, "run.md"), { features: `[${ids.join(", ")}]`, date, slug, commit, repo: target?.id || "knowledgebase" }));
  return file;
}
