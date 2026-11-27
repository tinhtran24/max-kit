import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "./args.mjs";
import { CONFIG_FILE, findRoot } from "../core/config.mjs";
import { agentMarker, underAgent, userTerminal } from "../secrets/agent.mjs";
import { audit, readAudit } from "../secrets/audit.mjs";
import { envFiles, environmentOf, parseDotenv, refFor } from "../secrets/dotenv.mjs";
import { approve, listGrants, parseTtl, pending, revoke } from "../secrets/grants.mjs";
import { backendName, vaultDir } from "../secrets/keystore.mjs";
import { runWithSecrets } from "../secrets/run.mjs";
import {
  annotateSecret,
  compareSecret,
  deleteSecret,
  describeSecret,
  listSecrets,
  revealSecret,
  rotateSecret,
  rotationDue,
  searchSecrets,
  setSecret,
  VaultError
} from "../secrets/vault.mjs";

const PROFILE_OPTS = ["description", "project", "environment", "provider", "account", "rotate-ttl"];
const STORES = /^(mk-vault|env-file|external:[\w.-]+)$/;

const USAGE = `usage: mk secrets <command>

  set <REF> --value=- | --value-file <f> [profile] [--force]   store a value (never as an argument)
  rotate <REF> --value=- | --value-file <f>                    replace a value, keep metadata
  annotate <REF> [profile]                                     change metadata only
  get|describe <REF> [--json]                                  metadata; the value prints as [redacted]
  list [--json]   search [words] [--project p ...] [--json]    find refs
  compare <REF> --value=- | --value-file <f>                   match or differs, never a value
  delete <REF> --yes                                           remove a ref
  import-env <dir|file> [--project p] [--dry-run] [--force]    import .env files
  export [--json]                                              metadata inventory, no values
  run [--env VAR=REF]... [--purpose p] -- <program> [args]     run with values injected, output redacted
  request <REF> --exec <program> [--env VAR] [--purpose p]     ask the user for a grant ahead of a job
  approve [<REF|id>...] [--ttl 24h | --once] [--deny]          user only, in their own terminal
  grants [--json]   revoke <REF> | --all                       inspect or remove grants
  audit [--secret REF] [--decision d] [--since 24h] [--json]   who used what, never values
  store [mk-vault|env-file|external:<name>] [--scope project|user]   the recorded secret-store choice
  status [--json]                                              backend, vault folder, counts

profile: --description --project --environment --provider --account --tag (repeat) --rotate-ttl 90d`;

function out(data, json) {
  if (json) console.log(JSON.stringify(data, null, 2));
  else if (Array.isArray(data)) for (const s of data) console.log(`${s.ref.padEnd(32)} ${[s.project, s.environment, s.provider].filter(Boolean).join(" / ")}${s.hint ? `  ${s.hint}` : ""}${s.description ? `  ${s.description}` : ""}`);
  else for (const [k, v] of Object.entries(data)) if (v !== null && v !== undefined && v !== "") console.log(`${k.padEnd(14)} ${Array.isArray(v) ? v.join(", ") : v}`);
}

function profileFrom(o) {
  const p = {};
  for (const k of PROFILE_OPTS) if (o.options[k] !== undefined) p[k === "rotate-ttl" ? "rotate_ttl" : k] = o.options[k];
  if (o.options.tag?.length) p.tags = o.options.tag.filter(Boolean);
  else if (o.options.tag && o.flags["clear-tags"]) p.tags = [];
  return p;
}

async function readStdin() {
  if (process.stdin.isTTY) throw new VaultError("--value=- reads stdin, but stdin is a terminal; pipe the value in from a script", 3);
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const c of process.stdin) data += c;
  return data;
}

async function hiddenPrompt(label) {
  if (!process.stdin.isTTY) throw new VaultError("no value given: use --value=- or --value-file", 3);
  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve) => {
    let v = "";
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(v);
      } else if (ch === "\u0003") process.exit(130);
      else if (ch === "\u007f") v = v.slice(0, -1);
      else v += ch;
    };
    process.stdin.on("data", onData);
  });
}

async function valueFrom(o) {
  const v = o.options.value;
  if (v !== undefined && v !== "-") throw new VaultError("--value=<literal> is refused: it would land in shell history and transcripts. Use --value=- or --value-file", 2);
  let raw;
  if (v === "-") raw = await readStdin();
  else if (o.options["value-file"]) raw = fs.readFileSync(o.options["value-file"], "utf8");
  else raw = await hiddenPrompt("value (hidden): ");
  return raw.replace(/\r?\n$/, "");
}

function refuseUnderAgent(what) {
  if (underAgent()) throw new VaultError(`${what} must be run by the user in their own terminal (detected ${agentMarker()}); give them the command instead`, 6);
  if (!userTerminal()) throw new VaultError(`${what} needs an interactive terminal`, 6);
}

const prefsFile = () => path.join(process.env.MK_PREFS_DIR || path.join(os.homedir(), ".max-kit"), "prefs.json");

export function storeChoice(cwd = process.cwd()) {
  const root = findRoot(cwd);
  if (root) {
    const c = JSON.parse(fs.readFileSync(path.join(root, CONFIG_FILE), "utf8"));
    if (c.secrets?.store) return { choice: c.secrets.store, scope: "project" };
  }
  try {
    const p = JSON.parse(fs.readFileSync(prefsFile(), "utf8"));
    if (p.secrets?.store) return { choice: p.secrets.store, scope: "user" };
  } catch {
    /* no user prefs yet */
  }
  return { choice: null, scope: null };
}

function setStore(choice, scope) {
  if (!STORES.test(choice)) throw new VaultError("store must be mk-vault, env-file or external:<name>", 2);
  if (scope === "user") {
    const f = prefsFile();
    let p = {};
    try {
      p = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch {
      p = {};
    }
    p.secrets = { ...p.secrets, store: choice };
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, `${JSON.stringify(p, null, 2)}\n`);
    return;
  }
  const root = findRoot();
  if (!root) throw new VaultError(`no ${CONFIG_FILE} here; use --scope user`, 2);
  const file = path.join(root, CONFIG_FILE);
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  c.secrets = { ...c.secrets, store: choice };
  fs.writeFileSync(file, `${JSON.stringify(c, null, 2)}\n`);
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  const o = parseArgs(rest, {
    flags: ["json", "force", "dry-run", "yes", "once", "deny", "all", "reveal", "include-values", "clear-tags"],
    options: [...PROFILE_OPTS, "value", "value-file", "purpose", "exec", "ttl", "secret", "decision", "since", "scope", "out"],
    multi: ["tag", "env"]
  });
  const [ref] = o._;
  const json = o.flags.json;

  switch (cmd) {
    case "set": {
      const s = setSecret(ref, await valueFrom(o), profileFrom(o), { force: o.flags.force });
      audit("set", { ref });
      out(json ? s : { stored: s.ref, hint: s.hint }, json);
      return 0;
    }
    case "rotate": {
      const s = rotateSecret(ref, await valueFrom(o));
      audit("rotate", { ref });
      out(json ? s : { rotated: s.ref, hint: s.hint }, json);
      return 0;
    }
    case "annotate": {
      out(annotateSecret(ref, profileFrom(o)), json);
      audit("annotate", { ref });
      return 0;
    }
    case "get":
    case "describe": {
      if (o.flags.reveal) {
        refuseUnderAgent("get --reveal");
        audit("reveal", { ref });
        console.log(revealSecret(ref));
        return 0;
      }
      const s = describeSecret(ref);
      out({ ...s, rotation_due: rotationDue(s) }, json);
      return 0;
    }
    case "list":
      out(listSecrets(), json);
      return 0;
    case "search": {
      const filters = { project: o.options.project, environment: o.options.environment, provider: o.options.provider, account: o.options.account, tag: o.options.tag[0] };
      out(searchSecrets(o._, filters), json);
      return 0;
    }
    case "compare": {
      const result = compareSecret(ref, await valueFrom(o));
      audit("compare", { ref, decision: result });
      out(json ? { ref, result } : { [ref]: result }, json);
      return 0;
    }
    case "delete":
    case "rm": {
      if (!o.flags.yes) throw new VaultError(`delete is permanent: confirm with the user, then rerun with --yes`, 2);
      deleteSecret(ref);
      audit("delete", { ref });
      console.log(`deleted ${ref}`);
      return 0;
    }
    case "import-env": {
      if (!ref) throw new VaultError("usage: mk secrets import-env <dir|file> [--project p] [--dry-run] [--force]", 2);
      const target = path.resolve(ref);
      const files = envFiles(target);
      const project = o.options.project || path.basename(fs.statSync(target).isDirectory() ? target : path.dirname(target));
      const envs = new Set(files.map(environmentOf));
      const existing = new Set(listSecrets().map((s) => s.ref));
      const plan = [];
      for (const f of files) {
        const environment = environmentOf(f);
        for (const { key, value } of parseDotenv(fs.readFileSync(f, "utf8"))) {
          if (!value) continue;
          const r = refFor(project, key, environment, envs.size > 1);
          const action = existing.has(r) && !o.flags.force ? "skip-existing" : existing.has(r) ? "replace" : "add";
          plan.push({ file: path.basename(f), key, ref: r, environment, action, value });
        }
      }
      if (!o.flags["dry-run"]) {
        for (const p of plan.filter((x) => x.action !== "skip-existing")) {
          setSecret(p.ref, p.value, { project, environment: p.environment, description: `${p.key} from ${p.file}` }, { force: true });
        }
        audit("import-env", { refs: plan.filter((x) => x.action !== "skip-existing").map((x) => x.ref) });
      }
      const report = plan.map(({ value, ...rest }) => rest);
      const counts = report.reduce((c, p) => ((c[p.action] = (c[p.action] || 0) + 1), c), {});
      if (json) console.log(JSON.stringify({ dryRun: Boolean(o.flags["dry-run"]), files: files.map((f) => path.basename(f)), counts, refs: report }, null, 2));
      else {
        for (const p of report) console.log(`${p.action.padEnd(14)} ${p.ref.padEnd(36)} ${p.file}`);
        console.log(`${o.flags["dry-run"] ? "would import" : "imported"}: ${JSON.stringify(counts)}; source files were not changed`);
      }
      return 0;
    }
    case "export": {
      if (o.flags["include-values"]) throw new VaultError("export --include-values is not supported; back up the vault folder and keep the key in your keychain", 2);
      out(listSecrets(), true);
      return 0;
    }
    case "run":
      return runWithSecrets({ program: o.rest[0], args: o.rest.slice(1), envPairs: o.options.env, purpose: o.options.purpose || "" });
    case "request": {
      if (!ref || !o.options.exec) throw new VaultError("usage: mk secrets request <REF> --exec <program> [--env VAR] [--purpose p]", 2);
      const { request } = await import("../secrets/grants.mjs");
      const r = request({ ref, program: path.basename(o.options.exec), env: o.options.env[0] || "" }, o.options.purpose || "");
      audit("request", { ref, program: r.program, decision: "pending" });
      console.log(`requested ${r.id}: ${ref} for ${r.program}${r.env ? ` as ${r.env}` : ""}. The user runs \`mk secrets approve\` in their own terminal.`);
      return 0;
    }
    case "approve": {
      refuseUnderAgent("approve");
      const reqs = pending();
      if (!reqs.length) {
        console.log("no pending requests");
        return 0;
      }
      if (o.options.ttl) parseTtl(o.options.ttl);
      const chosen = approve({ ids: o._, ttl: o.options.ttl || "24h", once: o.flags.once, deny: o.flags.deny });
      for (const r of chosen) {
        audit("approve", { ref: r.ref, program: r.program, decision: o.flags.deny ? "deny" : o.flags.once ? "once" : `ttl:${o.options.ttl || "24h"}` });
        console.log(`${o.flags.deny ? "denied" : "allowed"} ${r.ref} for ${r.program}${r.env ? ` as ${r.env}` : ""}${o.flags.deny ? "" : o.flags.once ? " (once)" : ` for ${o.options.ttl || "24h"}`}`);
      }
      return 0;
    }
    case "grants": {
      const g = { grants: listGrants(), requests: pending() };
      if (json) console.log(JSON.stringify(g, null, 2));
      else {
        for (const x of g.grants) console.log(`grant    ${x.ref.padEnd(28)} ${x.program} ${x.env || "(argument)"} ${x.once ? "once" : `until ${x.expires_at}`}`);
        for (const x of g.requests) console.log(`request  ${x.ref.padEnd(28)} ${x.program} ${x.env || "(argument)"} id ${x.id}`);
      }
      return 0;
    }
    case "revoke": {
      if (!ref && !o.flags.all) throw new VaultError("usage: mk secrets revoke <REF> | --all", 2);
      const n = revoke({ ref, all: o.flags.all });
      audit("revoke", { ref: ref || "*" });
      console.log(`revoked ${n} grant(s)`);
      return 0;
    }
    case "audit": {
      const entries = readAudit({ ref: o.options.secret, decision: o.options.decision, sinceMs: o.options.since ? parseTtl(o.options.since) : undefined });
      if (json) console.log(JSON.stringify(entries, null, 2));
      else for (const e of entries) console.log(`${e.at} ${e.action.padEnd(10)} ${(e.ref || (e.refs || []).join(",")).padEnd(30)} ${e.decision || ""}${e.agent ? " (agent)" : ""}`);
      return 0;
    }
    case "store": {
      if (ref) {
        setStore(ref, o.options.scope || "project");
        console.log(`secret store: ${ref} (${o.options.scope || "project"})`);
      } else out(storeChoice(), json);
      return 0;
    }
    case "status": {
      const s = { backend: backendName(), vault: vaultDir(), refs: listSecrets().length, rotation_due: listSecrets().filter((x) => rotationDue(x)).map((x) => x.ref), pending_requests: pending().length, agent: agentMarker() || "none", store: storeChoice().choice || "unset" };
      out(s, json);
      return 0;
    }
    default:
      console.log(USAGE);
      return cmd ? 2 : 0;
  }
}

export default async function secrets(argv) {
  try {
    return await main(argv);
  } catch (e) {
    if (e instanceof VaultError) {
      console.error(`mk secrets: ${e.message}`);
      return e.code;
    }
    throw e;
  }
}
