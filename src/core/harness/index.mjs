import { kb } from "../config.mjs";
import { result, writeOrCheck } from "../util.mjs";
import { loadFeatures, loadRuns, STATES } from "./store.mjs";

export function renderIndex(cfg) {
  const features = loadFeatures(cfg)
    .map((f) => f.data)
    .filter((f) => f && f.id);
  const lastRun = new Map();
  for (const { name, meta } of loadRuns(cfg)) for (const id of [].concat(meta?.features || [])) lastRun.set(id, name.slice(0, 10));

  const counts = STATES.map((s) => `${s}: ${features.filter((f) => f.state === s).length}`).join(", ");
  const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const rows = features
    .filter((f) => f.state !== "retired")
    .map((f) => `| ${f.id} | ${f.state} | ${cell(f.area)} | ${cell(f.title)} | ${lastRun.get(f.id) || ""} |`);

  return `# Harness Feature Index

Generated from \`harness/features/*.yml\`. Do not edit by hand; run \`npm run index\`.

Read this at boot to choose the feature id, then open only \`harness/features/<ID>.yml\`.

## State Summary

${counts}

## Feature Lookup

| ID | State | Area | Title | Last run |
| --- | --- | --- | --- | --- |
${rows.join("\n")}
`;
}

export function writeIndex(cfg, { check = false } = {}) {
  const r = result("feature index");
  const { changed, ok } = writeOrCheck(kb(cfg, "harness", "features-index.md"), renderIndex(cfg), check);
  if (!ok) r.errors.push("harness/features-index.md is stale; run npm run index");
  else if (changed) r.notes.push("wrote knowledge/harness/features-index.md");
  return r;
}
