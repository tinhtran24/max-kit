import { loadConfig, requireRoot } from "../core/config.mjs";
import { planVerify, runVerify } from "../core/harness/verify.mjs";
import { writeIndex } from "../core/harness/index.mjs";
import { rel } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

export default async function verify(argv) {
  const args = parseArgs(argv, { flags: ["allow-risky", "dry-run"], options: ["repo", "tier", "timeout"] });
  const id = args._[0];
  if (!id) {
    console.error("usage: max-kit verify <ID> [--repo <id>] [--tier high|low] [--allow-risky] [--dry-run] [--timeout <seconds>]");
    return 2;
  }
  const cfg = loadConfig(requireRoot());
  if (args.flags["dry-run"]) {
    for (const s of planVerify(cfg, id, { repo: args.options.repo }).steps) {
      console.log(`${s.repo.padEnd(14)} ${s.run}${s.covers?.length ? `   covers ${s.covers.join(", ")}` : ""}${s.risky ? "   RISKY: needs --allow-risky" : ""}`);
    }
    return 0;
  }
  if (args.options.tier && !["high", "low"].includes(args.options.tier)) throw new Error("--tier must be high or low");
  const r = runVerify(cfg, id, {
    repo: args.options.repo,
    tier: args.options.tier,
    allowRisky: args.flags["allow-risky"],
    timeoutSeconds: args.options.timeout ? Number(args.options.timeout) : undefined,
    log: (m) => console.log(m)
  });
  writeIndex(cfg);
  for (const n of r.notes) console.log(`note: ${n}`);
  console.log(`\n${r.passed ? "passed" : "failed"}: ${rel(cfg.root, r.runFile)}; ${id} is ${r.state}`);
  console.log("next: npm run log -- harness \"<title>\" \"Feature: " + id + "\", then npm run rollup and npm run check");
  return r.passed ? 0 : 1;
}
