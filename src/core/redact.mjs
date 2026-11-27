const PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED PRIVATE KEY]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED AWS KEY]"],
  [/\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g, "[REDACTED GITHUB TOKEN]"],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED SLACK TOKEN]"],
  [/\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}\b/g, "[REDACTED STRIPE KEY]"],
  [/\bsk-(ant-|proj-)?[A-Za-z0-9_-]{20,}\b/g, "[REDACTED API KEY]"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/g, "[REDACTED GOOGLE KEY]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED JWT]"],
  [/\b([a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)([^\s@/]+)(@)/gi, "$1[REDACTED]$3"],
  [/\b((?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret)["']?\s*[:=]\s*["']?)([^\s"',;]{4,})/gi, "$1[REDACTED]"]
];

export function redact(text) {
  let out = String(text ?? "");
  for (const [re, replacement] of PATTERNS) out = out.replace(re, replacement);
  return out;
}
