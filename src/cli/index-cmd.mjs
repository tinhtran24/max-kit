import { loadConfig, requireRoot } from "../core/config.mjs";
import { writeIndex } from "../core/harness/index.mjs";
import { printResult } from "../core/util.mjs";
import { parseArgs } from "./args.mjs";

export default async function index(argv) {
  const args = parseArgs(argv, { flags: ["check"] });
  return printResult(writeIndex(loadConfig(requireRoot()), { check: args.flags.check })) ? 0 : 1;
}
