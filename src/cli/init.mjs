import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CONFIG_FILE, KIT_ROOT, kitVersion, listProfiles, loadConfig } from "../core/config.mjs";
import { fill, today } from "../core/util.mjs";
import { appendLog, rollup } from "../core/harness/log.mjs";
import { writeIndex } from "../core/harness/index.mjs";
import { syncKnowledgebase } from "./sync.mjs";
import { parseArgs } from "./args.mjs";

export const TEMPLATE_DIR = path.join(KIT_ROOT, "template");
export const DEFAULT_KIT_SPEC = "github:tinhtran24/max-kit";
const RENAME = { gitignore: ".gitignore" };
const TEXT = /\.(md|json|yml|yaml)$|^gitignore$/;

export function copyTemplate(src, dst, vars, { only } = {}) {
  const written = [];
  const walk = (s, d, relPath) => {
    for (const name of fs.readdirSync(s)) {
      const sp = path.join(s, name);
      const target = RENAME[name] || name;
      const rp = relPath ? `${relPath}/${target}` : target;
      if (fs.statSync(sp).isDirectory()) {
        walk(sp, path.join(d, target), rp);
        continue;
      }
      if (only && !only(rp)) continue;
      fs.mkdirSync(d, { recursive: true });
      const out = path.join(d, target);
      if (TEXT.test(name) && !rp.startsWith("knowledge/templates/")) fs.writeFileSync(out, fill(fs.readFileSync(sp, "utf8"), vars));
      else fs.copyFileSync(sp, out);
      written.push(rp);
    }
  };
  walk(src, dst, "");
  return written;
}

function seedFeatures(dir, prefix, date) {
  const seeds = [
    {
      id: `${prefix}-HARNESS-001`,
      title: "Knowledgebase quality gate passes",
      area: "harness",
      summary: "Knowledgebase created with max-kit init; the quality gate must stay green.",
      behavior: "npm run check passes: harness lint, generated index and log, links, boot budget and generated runtime files.",
      verification: "  mode: automated\n  commands:\n    - npm run check\n  expected_result: \"check passed\""
    },
    {
      id: `${prefix}-BOOT-001`,
      title: "Agent sessions load the boot context",
      area: "boot",
      summary: "Every agent session must start with the read order and team rules.",
      behavior: "A new agent session in this folder confirms it loaded AGENTS.md, knowledge/synthesis/agent-boot.md and knowledge/harness/features-index.md.",
      verification:
        '  mode: manual\n  protocol: "Open a new session in this folder and ask it to confirm the boot files it loaded."\n  expected_result: "The session names the three boot files and quotes one team rule."'
    }
  ];
  for (const s of seeds) {
    fs.writeFileSync(
      path.join(dir, `${s.id}.yml`),
      `# yaml-language-server: $schema=../../../node_modules/max-kit/schemas/feature.json
id: ${s.id}
title: "${s.title}"
area: ${s.area}
priority: high
state: draft
verification_level: ${s.area === "boot" ? "boot" : "contract"}
trigger:
  type: tooling_decision
  summary: "${s.summary}"
behavior: >
  ${s.behavior}
verification:
${s.verification}
evidence: []
unknowns: []
updated_at: ${date}
`
    );
  }
  return seeds.map((s) => s.id);
}

export default async function init(argv) {
  const args = parseArgs(argv, { flags: ["force", "no-git"], options: ["project", "id-prefix", "profile", "kit", "targets"] });
  const target = path.resolve(args._[0] || ".");
  const project = args.options.project || path.basename(target);
  const prefix = (args.options["id-prefix"] || project.replace(/[^a-z0-9]/gi, "").slice(0, 4)).toUpperCase();
  const profile = args.options.profile || "generic";
  const targets = (args.options.targets || "claude").split(",").map((s) => s.trim());

  if (!/^[A-Z][A-Z0-9]*$/.test(prefix)) throw new Error("--id-prefix must be upper-case letters and digits, starting with a letter");
  if (!listProfiles().includes(profile)) throw new Error(`unknown profile "${profile}"; available: ${listProfiles().join(", ")}`);
  if (fs.existsSync(path.join(target, CONFIG_FILE))) throw new Error(`${target} already has ${CONFIG_FILE}; use max-kit update`);
  if (fs.existsSync(target) && fs.readdirSync(target).filter((f) => f !== ".git").length && !args.flags.force) {
    throw new Error(`${target} is not empty; pass --force to add max-kit to it`);
  }

  const date = today();
  fs.mkdirSync(target, { recursive: true });
  copyTemplate(TEMPLATE_DIR, target, { project, idPrefix: prefix, kitSpec: args.options.kit || DEFAULT_KIT_SPEC, date });
  const config = {
    $schema: "./node_modules/max-kit/schemas/config.json",
    project,
    idPrefix: prefix,
    profile,
    repos: [],
    targets,
    branches: { protected: ["main", "master", "develop"], deploy: ["staging", "production"] },
    guards: { riskyCommands: { extend: [] }, migrationPaths: { extend: [] } },
    harness: { staleActiveDays: 30, staleVerifiedDays: 120 },
    boot: { maxChars: 9000, maxInstructionLines: 80 },
    kitVersion: kitVersion()
  };
  fs.writeFileSync(path.join(target, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);

  const cfg = loadConfig(target);
  const ids = seedFeatures(path.join(target, "knowledge", "harness", "features"), prefix, date);
  appendLog(cfg, "tooling", "Knowledgebase created with max-kit", [`Kit: ${kitVersion()}`, `Profile: ${profile}`, `Seed features: ${ids.join(", ")}`], date);
  writeIndex(cfg);
  rollup(cfg);
  await syncKnowledgebase(cfg);

  if (!args.flags["no-git"] && !fs.existsSync(path.join(target, ".git"))) {
    try {
      execFileSync("git", ["init", "-q", target], { stdio: "ignore" });
    } catch {
      console.warn("git init failed; initialise the repository yourself");
    }
  }

  console.log(`created knowledgebase "${project}" in ${target} (prefix ${prefix}, profile ${profile}, targets ${targets.join(", ")})

next:
  cd ${path.relative(process.cwd(), target).startsWith("..") ? target : path.relative(process.cwd(), target) || "."}
  npm install
  npm run check
  npx max-kit install claude      # once per machine: hooks and the harness skill`);
  return 0;
}
