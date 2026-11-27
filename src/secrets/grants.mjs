import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { vaultDir } from "./keystore.mjs";

const file = () => path.join(vaultDir(), "grants.json");
const load = () => (fs.existsSync(file()) ? JSON.parse(fs.readFileSync(file(), "utf8")) : { requests: [], grants: [] });
const save = (d) => {
  fs.mkdirSync(vaultDir(), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file(), `${JSON.stringify(d, null, 2)}\n`, { mode: 0o600 });
};

export function parseTtl(ttl) {
  const m = String(ttl || "").match(/^(\d+)(m|h|d)$/);
  if (!m) throw new Error(`invalid ttl "${ttl}"; use e.g. 30m, 24h, 7d`);
  return Number(m[1]) * { m: 60000, h: 3600000, d: 86400000 }[m[2]];
}

const same = (a, b) => a.ref === b.ref && a.program === b.program && a.env === b.env;
const live = (g, at = Date.now()) => !g.used && (!g.expires_at || Date.parse(g.expires_at) > at);

export function findGrant(scope) {
  return load().grants.find((g) => same(g, scope) && live(g)) || null;
}

export function consume(scope) {
  const d = load();
  const g = d.grants.find((x) => same(x, scope) && live(x));
  if (!g) return false;
  if (g.once) g.used = true;
  save(d);
  return true;
}

export function request(scope, purpose = "") {
  const d = load();
  const existing = d.requests.find((r) => same(r, scope));
  if (existing) return existing;
  const r = { id: crypto.randomBytes(4).toString("hex"), ...scope, purpose, at: new Date().toISOString() };
  d.requests.push(r);
  save(d);
  return r;
}

export function pending() {
  return load().requests;
}

export function approve({ ids, ttl = "24h", once = false, deny = false }) {
  const d = load();
  const chosen = d.requests.filter((r) => !ids?.length || ids.includes(r.id) || ids.includes(r.ref));
  for (const r of chosen) {
    if (!deny) d.grants.push({ ref: r.ref, program: r.program, env: r.env, once, used: false, expires_at: once ? null : new Date(Date.now() + parseTtl(ttl)).toISOString(), granted_at: new Date().toISOString() });
  }
  d.requests = d.requests.filter((r) => !chosen.includes(r));
  d.grants = d.grants.filter((g) => live(g));
  save(d);
  return chosen;
}

export function listGrants() {
  const d = load();
  return d.grants.filter((g) => live(g));
}

export function revoke({ ref, all = false }) {
  const d = load();
  const before = d.grants.length;
  d.grants = all ? [] : d.grants.filter((g) => g.ref !== ref);
  d.requests = all ? [] : d.requests.filter((r) => r.ref !== ref);
  save(d);
  return before - d.grants.length;
}
