import path from "node:path";
import { branchOf } from "../core/git.mjs";
import { filesOf } from "./files.mjs";

const PUSH = /(?:^|\s)git((?:\s+-[cC]\s+\S+)*)\s+push(?=\s|$)(.*)$/;
const unquote = (w) => w.replace(/^['"]|['"]$/g, "");

export function pushTargets(command, cwd, currentBranch = branchOf) {
  const targets = [];
  for (const segment of command.split(/&&|\|\||[;&|\n]/)) {
    const m = segment.match(PUSH);
    if (!m) continue;
    const dirOpt = m[1].match(/-C\s+(\S+)/);
    const dir = dirOpt ? path.resolve(cwd, unquote(dirOpt[1])) : cwd;
    const words = m[2].trim().split(/\s+/).filter(Boolean).map(unquote);
    if (words.some((w) => w === "--all" || w === "--mirror")) {
      targets.push({ ref: "*", dir });
      continue;
    }
    const positional = words.filter((w) => !w.startsWith("-"));
    const refs = positional.length >= 2 ? positional.slice(1) : [currentBranch(dir)];
    for (let ref of refs) {
      ref = ref.replace(/^\+/, "");
      ref = ref.includes(":") ? ref.split(":").pop() : ref;
      ref = ref.replace(/^refs\/heads\//, "");
      if (ref === "HEAD") ref = currentBranch(dir);
      if (ref) targets.push({ ref, dir });
    }
  }
  return targets;
}

export default {
  id: "branch",
  events: ["pre-tool"],
  decide(input, cfg) {
    const { tool } = input;
    if (tool.kind === "shell" && tool.command) {
      for (const { ref } of pushTargets(tool.command, input.cwd)) {
        if (ref === "*") return { type: "deny", reason: "Pushing all branches at once is blocked. Push a single task branch instead." };
        if (cfg.branches.protected.includes(ref)) {
          return { type: "deny", reason: `Push to protected branch '${ref}' is blocked. Create a task branch (git checkout -b <type>/<short-name>) and push that instead.` };
        }
      }
      return null;
    }
    if ((tool.kind === "edit" || tool.kind === "write") && cfg.branches.deploy.length) {
      for (const f of filesOf(tool)) {
        const branch = branchOf(path.dirname(path.resolve(input.cwd, f.path)));
        if (branch && cfg.branches.deploy.includes(branch)) {
          return { type: "deny", reason: `'${branch}' is a deploy branch: do not edit code here. Ask the user to switch to a development branch first.` };
        }
      }
    }
    return null;
  }
};
