import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { renamePath, transform } from "../scripts/port-skills.mjs";
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
  write(path.join(dir, "skills", "zz-beta", "assets", "config.yaml.example"), "# copy to .zeta/config.yaml (Zeta)\n");
  fs.writeFileSync(path.join(dir, "skills", "zz-beta", "assets", "logo.bin"), Buffer.from([0x89, 0x50, 0x00, 0x5a, 0x65, 0x74, 0x61]));
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
  assert.equal(renamePath("techniques/fx-document-lezz-hunt.md", SRC), "techniques/fx-document-lezz-hunt.md", "a prefix inside a word is not a prefix");
  assert.equal(renamePath("zz-guide.md", SRC), "mk-guide.md");
  assert.equal(renamePath("scripts/find_zeta_repo.py", SRC), "scripts/find_max_kit_repo.py", "product names in paths follow the content rules");
  assert.equal(renamePath("assets/zeta-engineer-cases.json", SRC), "assets/max-kit-engineer-cases.json");
  assert.equal(renamePath("refs/zz-a/x.md", SRC), "refs/mk-a/x.md");
  const code = transform("const zetaHome = process.env.ZETA_HOME; function getZetaHome() {}; find_zeta_repo(); new ZetaDiagram(); 'zeta CLI'", SRC).out;
  assert.equal(transform("_zz_lib x; __zz_init; zz_on_path; uses_zz_ns; ZZ_GH_REST=1; pizza_zz", SRC).out, "_mk_lib x; __mk_init; mk_on_path; uses_mk_ns; MK_GH_REST=1; pizza_zz", "snake and upper forms of the prefix; a trailing suffix is left alone");
  assert.equal(transform("printf 'a\\nZZ_GH_REST: %s'", SRC).out, "printf 'a\\nMK_GH_REST: %s'", "after an escape sequence");
  assert.equal(transform("opts.zetaHome and .zeta/x", SRC).out, "opts.maxKitHome and .max-kit/x", "the config folder rule stops at identifiers");
  assert.equal(code, "const maxKitHome = process.env.MAX_KIT_HOME; function getMaxKitHome() {}; find_max_kit_repo(); new MaxKitDiagram(); 'max-kit CLI'");
  assert.equal(transform("see bestzetas/zeta-docs and bestzetas/zeta", { ...SRC, tokens: { "bestzetas/zeta-docs": "acme/docs", "bestzetas/zeta": "owner/max-kit" } }).out, "see acme/docs and owner/max-kit");
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
  assert.equal(fs.readFileSync(path.join(packs, "core-pack", "skills", "mk-beta", "assets", "config.yaml.example"), "utf8"), "# copy to .max-kit/config.yaml (max-kit)\n", "text is detected by content, not extension");
  assert.deepEqual([...fs.readFileSync(path.join(packs, "core-pack", "skills", "mk-beta", "assets", "logo.bin"))], [0x89, 0x50, 0x00, 0x5a, 0x65, 0x74, 0x61], "binary files are copied byte for byte");
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

test("rename-skill moves the folder and rewrites references, slash commands and paths", async () => {
  const { renameSkill } = await import("../scripts/rename-skill.mjs");
  const root = tmpDir("rename");
  write(path.join(root, "a", "pack.json"), JSON.stringify({ description: "a", skills: ["mk-long-name"], planned: [], maxSkillKb: { "mk-long-name": 900 } }));
  write(path.join(root, "a", "skills", "mk-long-name", "SKILL.md"), "---\nname: mk-long-name\ndescription: d\n---\nSee [x](../mk-long-name/ref.md).\n");
  write(path.join(root, "b", "pack.json"), JSON.stringify({ description: "b", skills: ["mk-user"], planned: [] }));
  write(path.join(root, "b", "skills", "mk-user", "SKILL.md"), "---\nname: mk-user\ndescription: d\n---\nRun /mk-long-name, then mk-long-name. Not mk-long-name-extra or file.mk-long-name.\n");
  const r = renameSkill("mk-long-name", "mk-short", { packs: root });
  assert.equal(r.manifests, 1);
  assert.ok(fs.existsSync(path.join(root, "a", "skills", "mk-short", "SKILL.md")));
  const meta = JSON.parse(fs.readFileSync(path.join(root, "a", "pack.json"), "utf8"));
  assert.deepEqual(meta.skills, ["mk-short"]);
  assert.deepEqual(meta.maxSkillKb, { "mk-short": 900 });
  assert.match(fs.readFileSync(path.join(root, "a", "skills", "mk-short", "SKILL.md"), "utf8"), /^name: mk-short$[\s\S]*\(\.\.\/mk-short\/ref\.md\)/m);
  assert.equal(
    fs.readFileSync(path.join(root, "b", "skills", "mk-user", "SKILL.md"), "utf8").split("\n").at(-2),
    "Run /mk-short, then mk-short. Not mk-long-name-extra or file.mk-long-name."
  );
  assert.throws(() => renameSkill("mk-user", "mk-short", { packs: root }), /already exists/);
});
