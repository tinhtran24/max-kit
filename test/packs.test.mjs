import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { transform } from "../scripts/port-skills.mjs";
import { lintSkills } from "../src/core/skills-lint.mjs";
import { syncKnowledgebase } from "../src/cli/sync.mjs";
import { editConfig, makeKb, tmpDir } from "./helpers.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = { prefix: "zz-", cli: "zz", product: "Zeta", configDir: ".zeta" };
let packs;

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

function sourceKit() {
  const dir = tmpDir("source");
  write(path.join(dir, "skills", "zz-alpha", "SKILL.md"), `---\nname: zz-alpha\ndescription: "Alpha skill; pairs with zz-beta."\nlicense: Proprietary\nmetadata:\n  author: zeta\n---\n\n# Alpha\n\nRun \`zz doctor\` then \`zz plan reindex\`. Settings live in .zeta/config.yaml. Built by Zeta.\n`);
  write(path.join(dir, "skills", "zz-alpha", "LICENSE.txt"), "zz-alpha\nCopyright (c) 2026 Zeta. All Rights Reserved.\n");
  write(path.join(dir, "skills", "zz-beta", "SKILL.md"), `---\nname: zz-beta\ndescription: "Beta skill."\n---\n\n# Beta\n\nSee [ref](references/zz-guide.md).\n`);
  write(path.join(dir, "skills", "zz-beta", "references", "zz-guide.md"), "guide\n");
  write(path.join(dir, "skills", "zz-beta", "LICENSE.txt"), "zz-beta\nCopyright (c) 2026 Zeta. All Rights Reserved.\nThe material below stays under its own licence.\n\nMIT License\n\nCopyright (c) 2025 Someone Else\n\nPermission is hereby granted, free of charge...\n");
  write(path.join(dir, "agents", "helper.md"), "---\nname: helper\ndescription: Helps with zz-alpha.\n---\n\nBody.\n");
  return dir;
}

before(() => {
  packs = tmpDir("packs");
  write(path.join(packs, "core-pack", "pack.json"), JSON.stringify({ description: "Test pack", requires: [], skills: [], agents: [], planned: ["mk-alpha", "mk-beta"], plannedAgents: ["mk-helper"] }));
  write(path.join(packs, "extra", "pack.json"), JSON.stringify({ description: "Needs core", requires: ["core-pack"], skills: [], agents: [], planned: [] }));
  process.env.MAX_KIT_PACKS_DIR = packs;
});

after(() => {
  delete process.env.MAX_KIT_PACKS_DIR;
});

test("transform renames, maps exact commands and reports the rest", () => {
  const { out, unmapped } = transform("Use zz-alpha. Run `zz doctor` and `zz plan reindex`. See .zeta/x and zeta docs.\nlicense: Proprietary\n  author: zeta\n", SRC);
  assert.match(out, /Use mk-alpha\./);
  assert.match(out, /`mk doctor`/);
  assert.match(out, /`zz plan reindex`/, "unmapped commands are left for a person to rewrite");
  assert.deepEqual(unmapped, ["plan"]);
  assert.match(out, /\.max-kit\/x and max-kit docs/);
  assert.doesNotMatch(out, /license:/);
  assert.match(out, /author: max-kit/);
  assert.equal(transform("break the jazz-band", SRC).out, "break the jazz-band", "only whole-prefix matches change");
});

test("port --write copies into packs, drops owner notices and keeps third-party ones", () => {
  const src = sourceKit();
  const notices = path.join(tmpDir("notices"), "THIRD_PARTY_NOTICES.md");
  const r = spawnSync(
    process.execPath,
    [path.join(KIT, "scripts", "port-skills.mjs"), "--source", path.join(src, "skills"), "--agents", path.join(src, "agents"), "--prefix", "zz-", "--cli", "zz", "--product", "Zeta", "--config-dir", ".zeta", "--packs-dir", packs, "--notices", notices, "--write"],
    { encoding: "utf8" }
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ported 2 skill\(s\), 1 agent\(s\)/);
  assert.match(r.stdout, /mk-alpha .*unmapped: planx1/);

  const alpha = fs.readFileSync(path.join(packs, "core-pack", "skills", "mk-alpha", "SKILL.md"), "utf8");
  assert.match(alpha, /^name: mk-alpha$/m);
  assert.doesNotMatch(alpha, /Zeta|zz-|\.zeta/);
  assert.ok(!fs.existsSync(path.join(packs, "core-pack", "skills", "mk-alpha", "LICENSE.txt")));
  assert.ok(fs.existsSync(path.join(packs, "core-pack", "skills", "mk-beta", "references", "mk-guide.md")));
  assert.match(fs.readFileSync(path.join(packs, "core-pack", "agents", "mk-helper.md"), "utf8"), /^name: mk-helper$/m);

  const n = fs.readFileSync(notices, "utf8");
  assert.match(n, /## mk-beta/);
  assert.match(n, /Copyright \(c\) 2025 Someone Else/);
  assert.doesNotMatch(n, /Zeta|All Rights Reserved/);

  const meta = JSON.parse(fs.readFileSync(path.join(packs, "core-pack", "pack.json"), "utf8"));
  assert.deepEqual(meta.skills, ["mk-alpha", "mk-beta"]);
  assert.deepEqual(meta.planned, []);
  assert.deepEqual(meta.agents, ["mk-helper"]);
});

test("skills lint checks names, references, commands and forbidden names", () => {
  const lint = () => lintSkills(KIT);
  const alpha = path.join(packs, "core-pack", "skills", "mk-alpha", "SKILL.md");
  const original = fs.readFileSync(alpha, "utf8");

  fs.writeFileSync(alpha, original.replace(/`zz plan reindex`/, "`mk verify`"));
  assert.deepEqual(lint().errors, []);

  fs.writeFileSync(alpha, `${original}\nAlso run \`mk frobnicate\` and use mk-nowhere.\n`);
  const errs = lint().errors.join("\n");
  assert.match(errs, /"mk frobnicate", which is not a max-kit command/);
  assert.match(errs, /refers to mk-nowhere/);

  process.env.MK_SKILLS_FORBIDDEN = "\\bzz ";
  assert.match(lint().errors.join("\n"), /forbidden source name/);
  delete process.env.MK_SKILLS_FORBIDDEN;
  fs.writeFileSync(alpha, original.replace(/`zz plan reindex`/, "`mk verify`"));
});

test("enabled packs render for claude and codex, with requires, and are pruned when disabled", async () => {
  const kb = await makeKb({ extra: ["--targets", "claude,codex"] });
  let cfg = editConfig(kb, (c) => (c.packs = ["extra"]));
  let r = await syncKnowledgebase(cfg);
  assert.deepEqual(r.errors, []);
  for (const f of [".claude/skills/mk-alpha/SKILL.md", ".claude/skills/mk-beta/references/mk-guide.md", ".claude/agents/mk-helper.md", ".agents/skills/mk-alpha/SKILL.md", ".agents/skills/mk-helper/SKILL.md"]) {
    assert.ok(fs.existsSync(path.join(kb, f)), f);
  }
  assert.deepEqual((await syncKnowledgebase(cfg, { check: true })).errors, []);

  cfg = editConfig(kb, (c) => (c.packs = []));
  assert.ok((await syncKnowledgebase(cfg, { check: true })).errors.some((e) => /mk-alpha\/SKILL\.md is no longer rendered/.test(e)));
  r = await syncKnowledgebase(cfg);
  assert.ok(!fs.existsSync(path.join(kb, ".claude/skills/mk-alpha")));
  assert.ok(fs.existsSync(path.join(kb, ".agents/skills/harness/SKILL.md")), "core skills stay");

  cfg = editConfig(kb, (c) => (c.packs = ["nope"]));
  assert.match((await syncKnowledgebase(cfg, { check: true })).errors.join("\n"), /unknown pack "nope"/);
});
