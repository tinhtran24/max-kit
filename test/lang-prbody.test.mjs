import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validatePrBody } from "../src/cli/pr-body.mjs";
import { normalizeLanguageTag } from "../src/cli/lang.mjs";
import { makeKb } from "./helpers.mjs";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "max-kit.mjs");
const mk = (cwd, args, { env = {}, input } = {}) =>
  spawnSync(process.execPath, [BIN, ...args], { cwd, input, encoding: "utf8", env: { ...process.env, MAX_KIT_LANGUAGE: "", MK_PREFS_DIR: path.join(cwd, ".home"), ...env } });

test("lang follows env, then prefs, then English; bad tags fall back with a reason", async () => {
  const kb = await makeKb();
  assert.equal(mk(kb, ["lang"]).stdout.trim(), "en");
  mk(kb, ["prefs", "set", "locale.responseLanguage", "vi"]);
  assert.deepEqual(
    (({ language, source }) => ({ language, source }))(JSON.parse(mk(kb, ["lang", "--json"]).stdout)),
    { language: "vi", source: "prefs:locale.responseLanguage" }
  );
  assert.equal(mk(kb, ["lang"], { env: { MAX_KIT_LANGUAGE: "ja" } }).stdout.trim(), "ja");
  mk(kb, ["prefs", "set", "locale.responseLanguage", "not a tag"]);
  const r = JSON.parse(mk(kb, ["lang", "--json"]).stdout);
  assert.equal(r.language, "en");
  assert.equal(r.fallbackReason, "invalid-tag");
  assert.deepEqual(normalizeLanguageTag(" PT-BR "), { ok: true, value: "pt-br" });
});

const FULL = [
  "## End-to-end work summary", "## Subagent delegation", "## Technical decisions", "## Deviations from plan",
  "## Completion evidence", "## Checklist", "## Human actions required", "## Linked Issues", "## Ship Mode"
].join("\n\nx\n\n");

test("pr-body check requires the contract sections; --loose skips traceability", async () => {
  const kb = await makeKb();
  assert.equal(validatePrBody(FULL).ok, true);
  assert.equal(validatePrBody(FULL.replace("## Bằng chứng", "")).ok, true);
  const vi = FULL.replace("## Completion evidence", "### Bằng chứng hoàn thành");
  assert.equal(validatePrBody(vi).ok, true, "Vietnamese headings count");
  const missing = mk(kb, ["pr-body", "check"], { input: FULL.replace("## Checklist", "") });
  assert.equal(missing.status, 1);
  assert.deepEqual(JSON.parse(missing.stdout).missingRequired, ["checklist"]);
  const noTrace = FULL.replace("## Linked Issues", "").replace("## Ship Mode", "");
  assert.equal(mk(kb, ["pr-body", "check"], { input: noTrace }).status, 1);
  assert.equal(mk(kb, ["pr-body", "check", "--loose"], { input: noTrace }).status, 0);
});
