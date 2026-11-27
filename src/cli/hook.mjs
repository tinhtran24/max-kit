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

export function askFallback(decision, adapter, cfg) {
  if (decision?.type !== "ask" || adapter.capabilities.ask !== false) return decision;
  if (cfg.guards.askFallback === "warn") return { type: "context", text: `max-kit warning: ${decision.reason}` };
  return {
    ...decision,
    type: "deny",
    reason: `${decision.reason} This runtime cannot ask from a hook, so the call is blocked: ask the user in chat; if they agree, they run it themselves or set guards.askFallback to "warn".`
  };
}

export async function handleHook(event, runtime, raw) {
  const adapter = await getAdapter(runtime);
  if (!adapter?.hookBridge) throw new Error(`runtime "${runtime}" has no hook bridge`);
  const input = adapter.hookBridge.parse(raw, event);
  const root = findRoot(input.cwd);
  if (!root) return { stdout: "", exitCode: 0 };
  const cfg = loadConfig(root);
  return adapter.hookBridge.respond(event, askFallback(runGuards(input, cfg), adapter, cfg));
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
