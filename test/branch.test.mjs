import { test } from "node:test";
import assert from "node:assert/strict";
import { pushTargets } from "../src/guards/branch.mjs";

const current = () => "feat/current";
const refs = (cmd) => pushTargets(cmd, "/work", current).map((t) => t.ref);

test("explicit remote and branch", () => {
  assert.deepEqual(refs("git push origin main"), ["main"]);
  assert.deepEqual(refs("git push -u origin feat/x"), ["feat/x"]);
});

test("no refspec uses the current branch", () => {
  assert.deepEqual(refs("git push"), ["feat/current"]);
  assert.deepEqual(refs("git push origin"), ["feat/current"]);
  assert.deepEqual(refs("git push origin HEAD"), ["feat/current"]);
});

test("refspec forms", () => {
  assert.deepEqual(refs("git push origin feat/x:main"), ["main"]);
  assert.deepEqual(refs("git push origin +main"), ["main"]);
  assert.deepEqual(refs("git push origin refs/heads/main"), ["main"]);
  assert.deepEqual(refs("git push origin a b"), ["a", "b"]);
  assert.deepEqual(refs("git push origin 'main'"), ["main"]);
});

test("chained commands and -C", () => {
  assert.deepEqual(refs("git add . && git commit -m x && git push origin main"), ["main"]);
  assert.deepEqual(refs("npm test; git -C api push origin develop"), ["develop"]);
  assert.equal(pushTargets("git -C api push origin x", "/work", current)[0].dir.replace(/\\/g, "/").endsWith("/work/api"), true);
});

test("all and mirror", () => {
  assert.deepEqual(refs("git push --all origin"), ["*"]);
  assert.deepEqual(refs("git push --mirror"), ["*"]);
});

test("not a push", () => {
  assert.deepEqual(refs("git status"), []);
  assert.deepEqual(refs("echo git pushes are blocked"), []);
  assert.deepEqual(refs("git stash push -m x"), []);
});
