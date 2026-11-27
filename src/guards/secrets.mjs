import path from "node:path";
import { filesOf } from "./files.mjs";

const EXEMPT = /\.(example|sample|template|dist|schema)$/i;
const READERS = /(^|[\s;&|(`])(cat|less|more|head|tail|bat|grep|egrep|rg|ag|awk|sed|cut|sort|strings|xxd|od|hexdump|base64|cp|mv|scp|rsync|curl|wget|nc|tee|source|\.|type|Get-Content|gc|python3?|node|ruby|perl|php)(\s|$)/;
const REVEAL = /\b(mk|max-kit)\s+secrets\s+(get|describe)\b[^|;&]*--reveal\b|\b(printenv|env)\s*($|[|;&])/;

const norm = (p) => p.split(path.sep).join("/");

export function isSecretPath(p, patterns) {
  const f = norm(p);
  if (EXEMPT.test(f)) return false;
  return patterns.some((re) => re.test(f));
}

export default {
  id: "secrets",
  events: ["pre-tool"],
  decide(input, cfg) {
    const patterns = cfg.guards.secretPaths.map((s) => new RegExp(s, "i"));
    const { tool } = input;
    const reason = (what) =>
      `${what} is a secrets file: agents must not read or write it. Use \`mk secrets\` (import-env, run --env VAR=REF) so values never enter the conversation, or ask the user.`;
    if (["read", "search", "edit", "write"].includes(tool.kind)) {
      for (const f of filesOf(tool)) if (isSecretPath(f.path, patterns)) return { type: "deny", reason: reason(f.path) };
      return null;
    }
    if (tool.kind === "shell" && tool.command) {
      if (REVEAL.test(tool.command)) return { type: "deny", reason: "Printing secret values or the whole environment is blocked for agents. Use `mk secrets run --env VAR=REF -- <program>` instead." };
      if (!READERS.test(tool.command)) return null;
      for (const token of tool.command.split(/[\s;&|()<>"'`=]+/).filter(Boolean)) {
        if (isSecretPath(token, patterns)) return { type: "deny", reason: reason(token) };
      }
    }
    return null;
  }
};
