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
  skills: ["./skills.mjs", "Skills and packs: skills lint | skills list"],
  install: ["./install.mjs", "Register the kit with a runtime: install <runtime> [--source <path|owner/repo>]"]
};

export const COMMAND_NAMES = Object.keys(COMMANDS);
