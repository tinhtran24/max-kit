import { findRoot, loadConfig } from "../core/config.mjs";
import { getAdapter } from "../adapters/registry.mjs";
import { EVENTS, runGuards } from "../guards/index.mjs";
import { parseArgs } from "./args.mjs";

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

export async function handleHook(event, runtime, raw) {
  const adapter = await getAdapter(runtime);
  if (!adapter?.hookBridge) throw new Error(`runtime "${runtime}" has no hook bridge`);
  const input = adapter.hookBridge.parse(raw, event);
  const root = findRoot(input.cwd);
  if (!root) return { stdout: "", exitCode: 0 };
  const decision = runGuards(input, loadConfig(root));
  return adapter.hookBridge.respond(event, decision);
}

export default async function hook(argv) {
  const args = parseArgs(argv, { options: ["runtime"] });
  const event = args._[0];
  const runtime = args.options.runtime || "claude";
  if (!EVENTS.includes(event)) {
    console.error(`usage: max-kit hook <${EVENTS.join("|")}> --runtime <id>`);
    return 2;
  }
  try {
    const out = await handleHook(event, runtime, await readStdin());
    if (out.stdout) process.stdout.write(out.stdout);
    return out.exitCode;
  } catch (e) {
    process.stderr.write(`max-kit hook ${event} failed open: ${e.message}\n`);
    return 0;
  }
}
