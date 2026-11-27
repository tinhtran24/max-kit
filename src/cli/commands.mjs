export const COMMANDS = {
  init: ["./init.mjs", "Create a knowledgebase: init [dir] --project <name> --id-prefix <ABC> [--profile <id>] [--detect]"],
  detect: ["./detect.mjs", "Detect stack, test command, migration generator and container per repo: detect [--write]"],
  sync: ["./sync.mjs", "Render runtime files from the knowledgebase: sync [--target a,b] [--dry-run] [--check]"],
  hook: ["./hook.mjs", "Hook entry point for agent runtimes: hook <event> --runtime <id>"],
  check: ["./check.mjs", "Quality gate: harness lint, index, log, links, boot budget, sync"],
  new: ["./new.mjs", "new feature <ID> \"<title>\" <area> [trigger] | new run <ID[,ID]> <slug> [--repo <id>]"],
  verify: ["./verify.mjs", "Run a feature's verification commands and record the evidence: verify <ID> [--repo <id>] [--tier high|low] [--allow-risky] [--dry-run]"],
  log: ["./log.mjs", "Append to this month's log: log <kind> \"<title>\" [note ...]"],
  index: ["./index-cmd.mjs", "Regenerate knowledge/harness/features-index.md: index [--check]"],
  rollup: ["./rollup.mjs", "Regenerate log index and recent changes: rollup [--check | --split <file>]"],
  update: ["./update.mjs", "Refresh kit-owned files in a knowledgebase and re-render"],
  doctor: ["./doctor.mjs", "Report setup problems"],
  adapters: ["./adapters.mjs", "adapters list | adapters show <id>"],
  improve: ["./improve.mjs", "Content-free skill and guard events: status, events, nudge, clear"],
  journal: ["./journal.mjs", "Session journals in plans/journals: create, list, show, validate"],
  handoff: ["./handoff.mjs", "Live state for a continuation note: branch, changes, current plan, active features [--json]"],
  lang: ["./lang.mjs", "Writing language for human-facing prose (MAX_KIT_LANGUAGE, prefs locale.responseLanguage) [--json]"],
  "pr-body": ["./pr-body.mjs", "Check a pull request body has the required sections: pr-body check [--loose] [--file f]"],
  plan: ["./plan.mjs", "Implementation plans as files: create, show, check, update, resolve, validate (mk plan help)"],
  prefs: ["./prefs.mjs", "Preferences: resolve, get, set, unset [--scope project|user]"],
  secrets: ["./secrets.mjs", "Encrypted local vault: set, get, search, run --env VAR=REF, approve, audit (mk secrets help)"],
  skills: ["./skills.mjs", "Skills and packs: skills lint | skills list"],
  install: ["./install.mjs", "Register the kit with a runtime: install <runtime> [--source <path|owner/repo>]"]
};

export const COMMAND_NAMES = Object.keys(COMMANDS);

export const SUBCOMMANDS = {
  improve: ["./improve.mjs", "Content-free skill and guard events: status, events, nudge, clear"],
  journal: ["./journal.mjs", "Session journals in plans/journals: create, list, show, validate"],
  handoff: ["./handoff.mjs", "Live state for a continuation note: branch, changes, current plan, active features [--json]"],
  lang: ["./lang.mjs", "Writing language for human-facing prose (MAX_KIT_LANGUAGE, prefs locale.responseLanguage) [--json]"],
  "pr-body": ["./pr-body.mjs", "Check a pull request body has the required sections: pr-body check [--loose] [--file f]"],
  plan: ["create", "add-phase", "list", "search", "show", "status", "check", "uncheck", "update", "use", "resolve", "validate", "close", "archive", "help"],
  "pr-body": ["check"],
  improve: ["status", "events", "nudge", "clear"],
  journal: ["create", "list", "show", "validate"],
  prefs: ["resolve", "get", "set", "unset", "validate"],
  secrets: ["set", "rotate", "annotate", "get", "describe", "list", "search", "compare", "delete", "rm", "import-env", "export", "run", "request", "approve", "grants", "revoke", "audit", "store", "status", "help"],
  skills: ["lint", "list"],
  adapters: ["list", "show"],
  new: ["feature", "run"]
};
