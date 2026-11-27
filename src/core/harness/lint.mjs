import fs from "node:fs";
import { kb } from "../config.mjs";
import { daysSince, result } from "../util.mjs";
import { loadFeatures, loadRuns, STATES, TRIGGERS, LEVELS, RUN_RESULTS } from "./store.mjs";

function lintAcceptance(at, f, r) {
  const v = f.verification || {};
  const ids = new Set();
  for (const [i, c] of (f.acceptance || []).entries()) {
    if (!c?.id) r.errors.push(`${at}: acceptance[${i}] needs an id`);
    else if (ids.has(c.id)) r.errors.push(`${at}: duplicate acceptance id ${c.id}`);
    else ids.add(c.id);
    if (!c?.then) r.errors.push(`${at}: acceptance ${c?.id || i} needs then (the observable outcome)`);
  }
  const covered = new Set([].concat(v.covers || []));
  for (const [i, c] of (v.commands || []).entries()) {
    if (typeof c === "string") continue;
    if (!c || typeof c.run !== "string" || !c.run) r.errors.push(`${at}: verification.commands[${i}] needs run`);
    for (const id of [].concat(c?.covers || [])) covered.add(id);
  }
  for (const id of covered) if (!ids.has(id)) r.errors.push(`${at}: covers unknown acceptance id ${id}`);
  for (const id of ids) if (!covered.has(id)) r.warnings.push(`${at}: acceptance ${id} is not covered by any verification command or protocol (covers)`);
}

export function lintHarness(cfg) {
  const r = result("harness lint");
  const idPattern = new RegExp(cfg.harness.idPattern);
  const ids = new Set();
  const exists = (ref) => /^https?:\/\//.test(ref) || fs.existsSync(kb(cfg, ref));

  for (const { name, data: f, error } of loadFeatures(cfg)) {
    const at = `features/${name}`;
    if (!f || typeof f !== "object") {
      r.errors.push(`${at}: ${error ? `invalid YAML: ${error}` : "not a YAML object"}`);
      continue;
    }
    for (const key of ["id", "title", "area", "state", "verification_level", "behavior", "updated_at"]) {
      if (!f[key]) r.errors.push(`${at}: missing ${key}`);
    }
    if (f.id) {
      if (`${f.id}.yml` !== name) r.errors.push(`${at}: id ${f.id} does not match the file name`);
      if (!idPattern.test(f.id)) r.errors.push(`${at}: id does not match ${cfg.harness.idPattern}`);
      if (ids.has(f.id)) r.errors.push(`${at}: duplicate id ${f.id}`);
      ids.add(f.id);
    }
    if (f.state && !STATES.includes(f.state)) r.errors.push(`${at}: state must be one of ${STATES.join(", ")}`);
    if (f.verification_level && !LEVELS.includes(f.verification_level)) r.errors.push(`${at}: verification_level must be one of ${LEVELS.join(", ")}`);
    if (!f.trigger?.type || !TRIGGERS.includes(f.trigger.type)) r.errors.push(`${at}: trigger.type must be one of ${TRIGGERS.join(", ")}`);
    if (!f.trigger?.summary) r.errors.push(`${at}: trigger.summary is required (no feature without a real trigger)`);
    const v = f.verification || {};
    if (!(v.commands?.length || v.protocol)) r.errors.push(`${at}: verification needs commands or protocol`);
    if (!v.expected_result) r.errors.push(`${at}: verification.expected_result is required`);
    lintAcceptance(at, f, r);

    for (const ref of f.evidence || []) if (!exists(ref)) r.errors.push(`${at}: evidence not found: ${ref}`);

    if (f.state === "passing") {
      if (!f.evidence?.length) r.errors.push(`${at}: passing needs evidence (no evidence means not done)`);
      if (!f.last_verified_at) r.errors.push(`${at}: passing needs last_verified_at`);
      if (f.unknowns?.length) r.errors.push(`${at}: passing must have no open unknowns`);
      if (f.last_verified_at && daysSince(f.last_verified_at) > cfg.harness.staleVerifiedDays) {
        r.warnings.push(`${at}: passing but last verified ${daysSince(f.last_verified_at)} days ago; re-verify or retire`);
      }
    }
    if (f.state === "blocked" && !f.blocker) r.errors.push(`${at}: blocked needs a blocker (missing env, source, credential, seed data or decision)`);
    if (f.state === "active" && f.updated_at && daysSince(f.updated_at) > cfg.harness.staleActiveDays) {
      r.warnings.push(`${at}: active for ${daysSince(f.updated_at)} days without update; finish, block or retire`);
    }
  }

  for (const { name, meta, error } of loadRuns(cfg)) {
    const at = `runs/${name}`;
    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(name)) r.errors.push(`${at}: name must be YYYY-MM-DD-<slug>.md`);
    if (!meta) {
      r.errors.push(`${at}: ${error ? `invalid front matter: ${error}` : "missing front matter"}`);
      continue;
    }
    const features = [].concat(meta.features || []);
    if (!features.length) r.errors.push(`${at}: front matter needs features`);
    for (const id of features) if (!ids.has(id)) r.errors.push(`${at}: unknown feature ${id}`);
    if (!RUN_RESULTS.includes(meta.result)) r.errors.push(`${at}: result must be one of ${RUN_RESULTS.join(", ")}`);
    if (meta.date && !name.startsWith(String(meta.date))) r.errors.push(`${at}: date ${meta.date} does not match the file name`);
    if (meta.result === "passed" && !meta.commit && !meta.pr) r.warnings.push(`${at}: passed run without commit or pr; stale evidence cannot be detected`);
  }
  r.notes.push(`${ids.size} feature(s)`);
  return r;
}
