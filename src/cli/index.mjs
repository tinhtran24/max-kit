const COMMANDS = {
  init: ["./init.mjs", "Create a knowledgebase: init [dir] --project <name> --id-prefix <ABC> [--profile <id>]"],
  sync: ["./sync.mjs", "Render runtime files from the knowledgebase: sync [--target a,b] [--dry-run] [--check]"],
  hook: ["./hook.mjs", "Hook entry point for agent runtimes: hook <event> --runtime <id>"],
  check: ["./check.mjs", "Quality gate: harness lint, index, log, links, boot budget, sync"],
  new: ["./new.mjs", "new feature <ID> \"<title>\" <area> [trigger] | new run <ID[,ID]> <slug> [--repo <id>]"],
  log: ["./log.mjs", "Append to this month's log: log <kind> \"<title>\" [note ...]"],
  index: ["./index-cmd.mjs", "Regenerate knowledge/harness/features-index.md: index [--check]"],
  rollup: ["./rollup.mjs", "Regenerate log index and recent changes: rollup [--check | --split <file>]"],
  update: ["./update.mjs", "Refresh kit-owned files in a knowledgebase and re-render"],
  doctor: ["./doctor.mjs", "Report setup problems"],
  adapters: ["./adapters.mjs", "adapters list | adapters show <id>"],
  install: ["./install.mjs", "Register the kit with a runtime: install <runtime> [--source <path|owner/repo>]"]
};

function help() {
  const width = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  const lines = Object.entries(COMMANDS).map(([name, [, desc]]) => `  ${name.padEnd(width)}  ${desc}`);
  return `usage: max-kit <command> [args]\n\n${lines.join("\n")}\n`;
}

export async function run(argv) {
  const [name, ...rest] = argv;
  if (!name || name === "help" || name === "--help" || name === "-h") {
    process.stdout.write(help());
    return 0;
  }
  if (name === "--version" || name === "-v") {
    const { kitVersion } = await import("../core/config.mjs");
    console.log(kitVersion());
    return 0;
  }
  const entry = COMMANDS[name];
  if (!entry) {
    console.error(`unknown command: ${name}\n`);
    process.stderr.write(help());
    return 2;
  }
  const mod = await import(entry[0]);
  return mod.default(rest);
}
