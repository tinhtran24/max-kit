import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { masterKey, open, seal, vaultDir } from "./keystore.mjs";

export const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
export const PROFILE_FIELDS = ["description", "project", "environment", "provider", "account", "tags", "rotate_ttl"];
const PUBLIC_PREFIXES = ["github_pat_", "sk_live_", "sk_test_", "rk_live_", "rk_test_", "sk-proj-", "sk-ant-", "glpat-", "xoxb-", "xoxp-", "xoxa-", "ghp_", "gho_", "ghs_", "ghu_", "npm_", "AKIA", "AIza", "sk-"];
export const MIN_HINT_LENGTH = 16;

export class VaultError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const file = () => path.join(vaultDir(), "vault.json");
const now = () => new Date().toISOString();

export function publicPrefix(value) {
  return PUBLIC_PREFIXES.find((p) => value.startsWith(p)) || "";
}

export function hintFor(value) {
  const prefix = publicPrefix(value);
  if (value.length - prefix.length < MIN_HINT_LENGTH) return { hint: null, hintReason: "short value" };
  return { hint: `${prefix}…${value.slice(-4)}`, hintReason: null };
}

function load() {
  if (!fs.existsSync(file())) return { version: 1, refs: {} };
  return JSON.parse(fs.readFileSync(file(), "utf8"));
}

function save(data) {
  fs.mkdirSync(vaultDir(), { recursive: true, mode: 0o700 });
  const tmp = `${file()}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file());
}

function checkRef(ref) {
  if (!REF_PATTERN.test(ref || "")) throw new VaultError(`invalid ref "${ref}": use letters, digits, _ . - (start with a letter or digit)`, 2);
}

function cleanProfile(profile = {}) {
  const out = {};
  for (const k of PROFILE_FIELDS) {
    if (profile[k] === undefined) continue;
    if (k === "tags") out.tags = [].concat(profile.tags).filter(Boolean);
    else out[k] = String(profile[k]);
  }
  return out;
}

function view(ref, entry) {
  return { ref, ...entry.profile, hint: entry.hint, hintReason: entry.hintReason, created_at: entry.created_at, updated_at: entry.updated_at, rotated_at: entry.rotated_at || null, value: "[redacted]" };
}

export function setSecret(ref, value, profile = {}, { force = false } = {}) {
  checkRef(ref);
  if (!value) throw new VaultError("empty value", 3);
  const data = load();
  if (data.refs[ref] && !force) throw new VaultError(`${ref} already exists; use rotate to change the value or annotate to change metadata`, 4);
  const { key } = masterKey();
  const t = now();
  data.refs[ref] = { box: seal(key, value), profile: cleanProfile(profile), ...hintFor(value), created_at: data.refs[ref]?.created_at || t, updated_at: t };
  save(data);
  return view(ref, data.refs[ref]);
}

export function rotateSecret(ref, value) {
  checkRef(ref);
  const data = load();
  const entry = data.refs[ref];
  if (!entry) throw new VaultError(`${ref} not found`, 5);
  if (!value) throw new VaultError("empty value", 3);
  const { key } = masterKey();
  const t = now();
  Object.assign(entry, { box: seal(key, value), ...hintFor(value), updated_at: t, rotated_at: t });
  save(data);
  return view(ref, entry);
}

export function annotateSecret(ref, profile) {
  const data = load();
  const entry = data.refs[ref];
  if (!entry) throw new VaultError(`${ref} not found`, 5);
  const next = { ...entry.profile, ...cleanProfile(profile) };
  for (const [k, v] of Object.entries(next)) if (v === "" || (Array.isArray(v) && !v.length)) delete next[k];
  entry.profile = next;
  entry.updated_at = now();
  save(data);
  return view(ref, entry);
}

export function deleteSecret(ref) {
  const data = load();
  if (!data.refs[ref]) throw new VaultError(`${ref} not found`, 5);
  delete data.refs[ref];
  save(data);
}

export function describeSecret(ref) {
  const entry = load().refs[ref];
  if (!entry) throw new VaultError(`${ref} not found`, 5);
  return view(ref, entry);
}

export function listSecrets() {
  const data = load();
  return Object.keys(data.refs)
    .sort()
    .map((ref) => view(ref, data.refs[ref]));
}

export function searchSecrets(words = [], filters = {}) {
  const terms = words.map((w) => w.toLowerCase());
  return listSecrets().filter((s) => {
    for (const k of ["project", "environment", "provider", "account"]) if (filters[k] && s[k] !== filters[k]) return false;
    if (filters.tag && !(s.tags || []).includes(filters.tag)) return false;
    const hay = [s.ref, s.description, s.project, s.environment, s.provider, s.account, ...(s.tags || [])].join(" ").toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function revealSecret(ref) {
  const entry = load().refs[ref];
  if (!entry) throw new VaultError(`${ref} not found`, 5);
  const { key } = masterKey({ create: false });
  if (!key) throw new VaultError("vault key not found; the vault cannot be read on this machine", 5);
  return open(key, entry.box);
}

export function compareSecret(ref, candidate) {
  const stored = revealSecret(ref);
  const tooShort = (v) => v.length - publicPrefix(v).length < MIN_HINT_LENGTH;
  if (tooShort(candidate) || tooShort(stored)) throw new VaultError(`compare needs values of at least ${MIN_HINT_LENGTH} characters after any public prefix`, 2);
  const a = crypto.createHash("sha256").update(stored).digest();
  const b = crypto.createHash("sha256").update(candidate).digest();
  return crypto.timingSafeEqual(a, b) ? "match" : "differs";
}

export function rotationDue(s, at = Date.now()) {
  const m = String(s.rotate_ttl || "").match(/^(\d+)d$/);
  if (!m) return false;
  const since = Date.parse(s.rotated_at || s.created_at);
  return at - since > Number(m[1]) * 86400000;
}
