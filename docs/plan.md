# max-kit implementation plan

max-kit is an installable kit that gives any software project a **control-plane knowledgebase** for coding agents: what to read first, which rules apply, which commands are dangerous, and what proves a task is done. It is written once in a runtime-neutral form and rendered into whatever agent runtime the team uses (Claude Code first, Codex CLI second, others through adapters added later).

## 1. Goals and non-goals

Goals

- Work for any stack (Rails, Laravel, Node, Django, Go, plain repos) through **profiles**, not hard-coded patterns.
- One source of truth, many runtimes: an **adapter registry** renders rules, skills, agents and guards for each runtime. Adding a runtime means adding one adapter folder or one npm package, with no change to core.
- Evidence-based done: a task is done only when a verification run with real output exists for the current commit.
- Small core, optional **packs** for extra capability.
- Safe by default: branch, migration, risky-command and secret guards on from day one.
- Cross-platform: macOS, Linux and Windows (Node only, no bash or jq at runtime).

Non-goals

- Not a general prompt or skill library. Each pack stays small so skill triggering stays reliable.
- Not a security boundary. Guards catch mistakes; they do not stop a determined bypass.
- No telemetry leaves the machine.

## 2. Architecture

```text
max-kit/
  package.json            bin: max-kit
  bin/max-kit.mjs         CLI entry
  src/
    cli/                  one file per command
    core/
      config.mjs          load + validate max-kit.config.json
      model.mjs           neutral model: rules, skills, agents, guards, commands
      harness/            feature lint, index, runs, log, rollup, check
      detect/             stack detection
    guards/               runtime-neutral guard logic (pure functions)
    adapters/
      registry.mjs        discovery + capability checks
      claude/             adapter.mjs, templates/
      codex/              adapter.mjs, templates/
      agents-md/          generic AGENTS.md renderer used by many runtimes
  profiles/               generic, rails, laravel, node, django, go (JSON, so the hook path needs no dependency)
  packs/                  security, onboarding, tracker-github, tracker-jira, tracker-linear, code-index
  skills/                 harness, handoff, verify (SKILL.md format; also the Claude plugin's skills)
  agents/                 verifier, reviewer (Markdown with front matter)
  hooks/hooks.json        Claude plugin hooks, all pointing at `max-kit hook`
  .claude-plugin/         plugin and marketplace manifests
  template/               knowledgebase skeleton copied by init
  schemas/                JSON Schemas: config, feature, run, adapter manifest
  test/                   unit + golden-file tests per adapter
  docs/
```

### 2.1 Neutral model

Every piece of content is loaded into one in-memory model before any runtime sees it:

| Kind | Source | Fields |
| --- | --- | --- |
| rule | `knowledge/synthesis/team-rules.md`, `agent-boot.md` | id, scope (boot, repo, folder), body, budget weight |
| skill | `skills/*/SKILL.md`, pack skills | name, description, triggers, body, scripts |
| agent | `agents/*.md` | name, description, tools (neutral names), body |
| guard | `src/guards/*.mjs` + profile patterns | id, event (session, prompt, pre-tool, stop, pre-compact), tool kinds, decide(input) |
| command | `package.json` scripts of the knowledgebase | name, description |

Neutral tool kinds (`shell`, `edit`, `write`, `read`, `search`, `web`) are mapped to each runtime's tool names by its adapter.

### 2.2 Adapter contract (the extension point)

An adapter is a module that exports:

```js
export default {
  id: 'codex',
  displayName: 'Codex CLI',
  minKitVersion: '0.3.0',
  capabilities: {
    instructions: 'native',      // native | import | none
    skills: 'native',
    agents: 'none',
    hooks: ['session', 'prompt', 'pre-tool', 'post-tool', 'stop'],
    plugin: 'native',            // installable package format
    blocking: 'exit-code-2'      // how a guard denies a call
  },
  detect(ctx) {},                // is this runtime installed / used in the project?
  render(model, ctx) {},         // -> [{ path, content, mode }] ; pure, no disk writes
  hookBridge: {
    parse(stdin, event) {},      // runtime payload -> neutral GuardInput
    respond(decision) {}         // neutral Decision -> { stdout, exitCode }
  },
  install(ctx) {},               // optional: register plugin / marketplace
  doctor(ctx) {}                 // optional: report problems
}
```

Rules that keep it dynamic:

- **Discovery**: built-in adapters in `src/adapters/*`, plus any npm package named `max-kit-adapter-*` or listed in `config.adapters`. `max-kit adapters list` shows id, source, version and capabilities.
- **Capability fallback**: if a runtime lacks a capability, the registry degrades instead of failing. No hooks means guard rules are rendered as plain instructions and `max-kit check` runs them in CI. No agents means agent bodies are rendered as skills. No skills means skills are linked from the instructions file.
- **Pure render**: `render()` returns files; the CLI decides whether to write, diff (`--dry-run`) or verify (`--check`). This makes golden-file tests trivial.
- **One hook runner**: every runtime calls `max-kit hook <event> --runtime <id>`. The bridge normalises the payload, core guards decide, the bridge formats the answer. Guard logic is written once.
- **Generated-file header**: every rendered file starts with `generated by max-kit sync; edit the source, not this file`, and `sync --check` fails in CI when a generated file drifts.
- **Scaffolding**: `max-kit adapters new <id>` creates an adapter folder with the contract, a golden test and a capability table entry.

### 2.3 Runtime targets

| Runtime | Instructions | Skills | Agents | Hooks | Package | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code (CLI, VS Code, JetBrains, desktop) | `CLAUDE.md` importing `AGENTS.md` | `.claude/skills/` or plugin | `.claude/agents/` or plugin | plugin `hooks/hooks.json` | plugin + marketplace | 1 |
| Codex CLI (+ IDE extension) | `AGENTS.md` | `.agents/skills/` | rendered as skills | `.codex/hooks.json` | Codex plugin | 3 |
| Generic AGENTS.md readers | `AGENTS.md` | linked | none | none (CI check) | none | 3 |
| Gemini CLI | `GEMINI.md` or `contextFileName` | per its format | — | per its format | extension | later |
| Cursor | `.cursor/rules/` | — | — | — | — | later |
| GitHub Copilot | `.github/copilot-instructions.md` | — | — | — | — | later |

Claude Code IDE integrations (VS Code, JetBrains) run the same engine and read the same plugin, so the Claude adapter covers them. Each "later" row is one adapter; confirm the runtime's current file names and hook format from its official docs when writing the adapter, since these change often.

### 2.4 Configuration

`max-kit.config.json` in the knowledgebase root:

```json
{
  "$schema": "./node_modules/max-kit/schemas/config.json",
  "project": "shop",
  "idPrefix": "SHOP",
  "profile": "rails",
  "repos": [{ "id": "api", "path": "api", "profile": "rails", "container": "shop_api" }],
  "targets": ["claude", "codex"],
  "packs": ["security", "tracker-github"],
  "branches": { "protected": ["main", "develop"], "deploy": ["staging", "production"] },
  "guards": { "riskyCommands": { "extend": [] }, "secretPaths": { "extend": [] } },
  "harness": { "staleActiveDays": 30, "staleVerifiedDays": 120 },
  "boot": { "maxChars": 9000, "maxInstructionLines": 40 }
}
```

Profiles fill everything the project does not set: migration folders and the generator command, test and lint commands, risky command patterns, default verifiers. A repo may override the project profile.

## 3. Phases

Each phase ends with its features passing in the kit's own harness (the kit dogfoods itself). Estimates assume one developer with an agent.

### Phase 0 — Repository and foundation (1–2 days)

- Create `max-kit` on GitHub; choose a licence; Node 20+, ESM, one runtime dependency (`yaml`), none on the hook path.
- CI: lint, unit tests, golden tests, `max-kit check` on the kit itself, on macOS, Linux and Windows.
- Port the existing harness tooling (feature lint, index, runs, log, rollup, wiki lint, boot budget) into `src/core/harness/` behind the new CLI; drop shell scripts.
- Schemas for config, feature, run.

Done when: `npx max-kit check` passes on the kit repo in CI on all three OSes.

### Phase 1 — Core CLI + Claude adapter (4–5 days)

Commands:

| Command | Does |
| --- | --- |
| `max-kit init [dir] --project --id-prefix --profile` | Copy the skeleton, seed features, write config, `git init` |
| `max-kit sync [--target] [--dry-run] [--check]` | Render all targets from the neutral model |
| `max-kit hook <event> --runtime <id>` | Single hook entry point |
| `max-kit check` | Quality gate: harness lint, index, log, links, boot budget, `sync --check` |
| `max-kit new feature|run`, `max-kit log`, `max-kit index` | Harness authoring |
| `max-kit update` | Replace kit-owned paths, keep project content, record version |
| `max-kit doctor` | Node version, runtimes found, plugin installed, hooks registered, stale generated files |

Claude adapter: plugin manifest, marketplace entry, `hooks/hooks.json` pointing at `max-kit hook`, `CLAUDE.md` as an `@AGENTS.md` import plus Claude-only notes, skills and agents.

Guards (neutral): boot context, protected-branch push, deploy-branch edit, hand-written migration, risky command confirmation, evidence reminder at stop.

Done when: a new knowledgebase created with `init`, opened in Claude Code, loads the boot context, and each guard has a passing test that feeds a recorded payload through the bridge.

### Phase 2 — Generic projects: profiles and detection (3–4 days)

- Profiles: `generic`, `rails`, `laravel`, `node`, `django`, `go` (YAML, schema-validated, extendable by `extends:`).
- `max-kit detect`: reads `Gemfile`, `composer.json`, `package.json`, `pyproject.toml`, `go.mod`, `docker-compose*.yml` in each repo; proposes profile, test command, migration folder and generator, container name; writes config only with `--write`.
- `init --detect` runs detection during setup.
- Guard patterns come only from profiles plus config `extend` lists.

Done when: detection on one sample repo per profile produces the expected config (golden tests), and the migration guard blocks a hand-written file in each profile's migration folder.

### Phase 3 — Codex adapter and the adapter registry (3–4 days)

- Registry with discovery, capability fallback, `adapters list|new`.
- Codex adapter: `AGENTS.md`, `.agents/skills/`, `.codex/hooks.json` bridge, plugin package.
- Generic `agents-md` adapter for any runtime that reads `AGENTS.md` only.
- Tool-name mapping tables per adapter.
- External adapter loading from `max-kit-adapter-*` packages, with a version check against `minKitVersion`.

Done when: the same knowledgebase renders for both runtimes with `sync`; golden tests cover both; a stub external adapter installed from a local path is discovered and rendered; the branch guard blocks a push in both runtimes using recorded payloads.

### Phase 4 — Trustworthy evidence (4–5 days)

- Feature schema gains `acceptance:` (Given/When/Then items with ids); each `verification` step names the criteria it covers. Lint warns on criteria with no evidence.
- `max-kit verify <ID>`: runs the feature's commands in the right repo, captures output (redacted), records commit, branch, runtime, timestamp and result, writes the run file and moves state on success.
- Stale evidence: `check` flags a passing feature whose recorded commit is behind the repo's current commit for the touched paths.
- Verifier agent: a fresh-context agent that receives only the feature file and its runs and returns pass or a list of gaps. Rendered as an agent where supported, as a skill otherwise.
- Optional import of acceptance criteria from an external spec file.

Done when: `verify` on a seeded feature writes a valid run file and passes lint; changing the repo makes `check` report stale evidence.

### Phase 5 — Context and session continuity (3 days)

- `pre-compact` guard: store active feature, branch, dirty repos in `.max-kit/state.json`; the session guard re-injects them after compaction or resume.
- `max-kit handoff`: writes a continuation note (active features, open questions, uncommitted changes, next step) for a new session or another runtime.
- Context budget guard: warn on very large reads, unbounded searches and huge command output inside app repos; never blocks.
- Status line output for runtimes that support one: project, active feature, state.

Done when: a simulated compaction round-trip restores the anchors; `handoff` output passes a schema check and contains no secret values.

### Phase 6 — Security pack (2 days)

- Block reads and writes of `.env*`, key and credential files (patterns from profile + config).
- Redact token-like strings in hook output and run files.
- Confirm before commands that reach production hosts or start workers (profile patterns).

Done when: the guard test suite covers allow, warn and block cases for each rule in both runtimes.

### Phase 7 — Self-improvement loop (3 days)

- At stop: record user corrections and guard hits (counts and rule ids only, no transcript content) to `knowledge/maintenance/review-queue.md`.
- At session start: when the same correction appears three times, suggest promoting it to a team rule (one line, shown once).
- Behaviour report: repeated reads of unchanged files, re-running the same failing command, repo-wide sweeps; written to the monthly log, never blocking.

Done when: a scripted session with repeated corrections produces exactly one promotion suggestion.

### Phase 8 — Packs and visibility (4 days)

- `tracker-github`, `tracker-jira`, `tracker-linear`: feature `trigger` links a ticket; draft-before-write rule; uses the runtime's connector, never stores tokens.
- `onboarding`: human onboarding pages generated from business pages, multi-language, with a "no impact" escape hatch.
- `code-index`: a pluggable code-graph provider (any CLI that answers symbol, caller and impact queries); boot text tells the agent when to use it.
- `max-kit status --html`: static page of features by state, stale evidence and blockers; CI uploads it as an artefact.

Done when: each pack installs and uninstalls cleanly with `sync`, and `check` passes with every pack combination in CI.

### Phase 9 — Evals and release (2–3 days)

- Skill trigger evals: prompts like "is this done", "record evidence", "hand this off" must load the right skill in each runtime.
- Guard evals: recorded payloads from each runtime replayed through the bridge.
- Budgets in `check`: boot context size and hook latency (target under 200 ms).
- Release: semver tags, changelog, `npx max-kit@latest init`, plugin marketplace listing, migration guide from an existing knowledgebase.

Done when: v1.0.0 is tagged and a fresh machine goes from `npx max-kit init` to a passing `check` inside both Claude Code and Codex CLI.

## 4. Adding a new runtime later

1. `max-kit adapters new <id>` creates the folder, the contract and a golden test.
2. Fill `capabilities` from the runtime's official docs.
3. Implement `render()` (instruction file, skills, agents).
4. If the runtime has hooks, implement `hookBridge.parse/respond` and record sample payloads under `test/fixtures/<id>/`.
5. Add the id to `targets` in a knowledgebase and run `max-kit sync --dry-run`, then `sync`, then `check`.
6. Publish in-repo or as `max-kit-adapter-<id>` on npm.

No core change is needed unless the runtime introduces a new hook event, in which case the neutral event list gains one entry and other adapters ignore it.

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Runtime formats change (file names, hook payloads) | Fixtures per runtime, `doctor` warns on unknown payload fields, adapters versioned independently |
| Too many skills dilute triggering | Core ships 3 skills; packs are opt-in and capped; trigger evals in CI |
| Guards bypassed by the agent writing its own scripts | Documented as guardrails; CI `check` repeats the critical checks |
| Generated files edited by hand | Header + `sync --check` in CI |
| Windows path and shell differences | Node-only runtime, CI on Windows from Phase 0 |
| Boot context grows past runtime limits | Budget in `check`, per-adapter limit in capabilities |

## 6. First week checklist

1. Create the GitHub repo `max-kit`, push this plan and an empty `package.json`.
2. Phase 0: port harness tooling into `src/core/harness/`, CI matrix green.
3. Phase 1: CLI skeleton, `init`, `sync`, `hook`, `check`, Claude adapter, guard tests.
4. Dogfood: create the kit's own knowledgebase features `MK-CORE-001`, `MK-CLAUDE-001`, `MK-GUARD-001` and record runs.
