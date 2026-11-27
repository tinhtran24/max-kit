import { resolvePrefs } from "./prefs.mjs";

export const DEFAULT_LANGUAGE = "en";
const TAG = /^[a-z]{2,3}(-[a-z0-9]+)*$/;

export function normalizeLanguageTag(raw) {
  if (raw === null || raw === undefined) return { ok: false, reason: "empty" };
  if (typeof raw !== "string") return { ok: false, reason: "not-a-string" };
  const value = raw.trim().toLowerCase();
  if (!value) return { ok: false, reason: "empty" };
  return TAG.test(value) ? { ok: true, value } : { ok: false, reason: "invalid-tag" };
}

export function resolveWritingLanguage({ cwd = process.cwd(), env = process.env } = {}) {
  const prefs = resolvePrefs(cwd).prefs || {};
  const locale = prefs.locale && typeof prefs.locale === "object" ? prefs.locale : {};
  const candidates = [
    { source: "env:MAX_KIT_LANGUAGE", raw: env.MAX_KIT_LANGUAGE },
    { source: "prefs:locale.responseLanguage", raw: locale.responseLanguage }
  ];
  const rejected = [];
  for (const c of candidates) {
    if (c.raw === null || c.raw === undefined || c.raw === "") continue;
    const n = normalizeLanguageTag(c.raw);
    if (n.ok) return { language: n.value, source: c.source, requested: String(c.raw).trim(), fallbackReason: null, rejected, defaultLanguage: DEFAULT_LANGUAGE };
    rejected.push({ source: c.source, raw: String(c.raw).trim(), reason: n.reason });
  }
  const last = rejected.at(-1) || null;
  return { language: DEFAULT_LANGUAGE, source: "default", requested: last ? last.raw : null, fallbackReason: last ? last.reason : null, rejected, defaultLanguage: DEFAULT_LANGUAGE };
}

export default async function lang(argv) {
  const r = resolveWritingLanguage();
  console.log(argv.includes("--json") ? JSON.stringify(r, null, 2) : r.language);
  return 0;
}
