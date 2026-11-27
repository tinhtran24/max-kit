import { COMMANDS } from "./commands.mjs";

function help() {
  const width = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  const lines = Object.entries(COMMANDS).map(([name, [, desc]]) => `  ${name.padEnd(width)}  ${desc}`);
  return `usage: max-kit <command> [args]   (alias: mk)\n\n${lines.join("\n")}\n`;
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
