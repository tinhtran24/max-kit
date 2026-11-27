import { execFileSync } from "node:child_process";
import { existingDir } from "./util.mjs";

function git(dir, args) {
  try {
    return execFileSync("git", ["-C", existingDir(dir), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export const branchOf = (dir) => git(dir, ["branch", "--show-current"]);
export const headOf = (dir) => git(dir, ["rev-parse", "--short", "HEAD"]);
export const isDirty = (dir) => git(dir, ["status", "--porcelain"]).length > 0;
