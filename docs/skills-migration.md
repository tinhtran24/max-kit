# Skills migration plan

This plan moves the source kit's agent content into max-kit: 105 skills (12.8 MB, 1,769 files), 16 agents, 8 rule files and about 22 hooks. The owner of the source kit has authorised the port.

## 1. Rules

| Rule | How |
| --- | --- |
| Naming | Every skill, agent and command uses the `mk-` prefix, with a short descriptive name: long or branded source names are shortened (`uiux`, `react`, `frontend`, `ux-audit`, `backend`, `payments`, `google-adk`, `mobile`, `cti`, `media`) with `scripts/rename-skill.mjs mk-old=mk-new`, which moves the folder and rewrites every reference across packs. The CLI gains an `mk` alias, so `mk check` = `max-kit check`. No source prefix, source product name or source config folder remains anywhere in the repo. `mk skills lint` enforces this. |
| Owner's notices | The source kit's proprietary licence files and `license: Proprietary` front matter are removed. Ported content is licensed under max-kit's licence. |
| Third-party notices | MIT and Apache material from other authors keeps its copyright and licence text, collected in `THIRD_PARTY_NOTICES.md` (one section per skill). Affected: handoff, deep-swe, folder-context, interview-docs, research-prompt, codex-goal, chrome-profile, cti, design, tech-graph, agent-browser, mcp-builder, skill-creator, ui-styling, uiux (data), react. |
| No dead commands | A skill may only tell the agent to run commands that exist. Source CLI calls are mapped to `mk` commands (section 4) or the passage is rewritten. The port script reports every unmapped call; a skill does not ship with any. |
| Small core | Only the harness workflow is always on. Everything else ships in opt-in packs, so an unused skill never competes for triggering. |

## 2. Where things go

```text
skills/                     always-on core (Claude plugin + rendered for Codex)
agents/                     always-on agents (verifier, and the mk-* agents below)
packs/<pack>/pack.json      name, description, skills, agents, requires
packs/<pack>/skills/mk-*/   pack skills
packs/<pack>/agents/mk-*.md pack agents
scripts/port-skills.mjs     one-off port tool (dev only, not published)
THIRD_PARTY_NOTICES.md
```

A knowledgebase enables packs in `max-kit.config.json` › `packs`. `mk sync` renders the enabled packs into `.claude/skills/`, `.claude/agents/` and `.agents/skills/`. Rendered pack folders are generated: they are listed in the knowledgebase `.gitignore`, and a `postinstall` script runs `mk sync` so `npm install` recreates them.

## 3. Packs

| Pack | Skills | Notes |
| --- | --- | --- |
| `workflow` | advise, brainstorm, plan, cook, fix, debug, test, code-review, scout, ask, explain, bro, sumup, problem-solving, predict, scenario, issue-to-plan, atoz, research, research-prompt, sowat, xia, fable-thinking | `plan` writes harness features with acceptance criteria; `cook` and `fix` close with `mk verify` |
| `continuity` | handoff, journal, retro, watzup, context-engineering, dogfood, goal-warmup, loop, autoresearch, codex-goal, folder-context, interview-docs | `journal` writes through `mk log`; `handoff` reads active features |
| `delivery` | git, github, review-pr, ship, vibe, worktree | `ship` runs `mk check` and `mk verify` before the PR |
| `orchestration` | team, project-management, plans-kanban, router, help, find-skills, skill-creator, coding-level; orchestrate deferred | router written new; help, coding-level and plans-kanban rewritten on `mk skills`, `mk prefs` and `mk plan`; skill-creator keeps local authoring and drops publishing lanes |
| `frontend` | frontend-design, frontend, react, web-frameworks, tanstack, ui-styling, uiux, ux-audit, page-builder, stitch, show-off, threejs, shader, webmcp | large (about 2.7 MB) |
| `backend` | backend, databases, better-auth, payments, shopify, google-adk, agentize, mcp-builder | |
| `ops` | devops, deploy, security, vault | `vault` needs `mk secrets` (section 4) or is rewritten for the user's secret manager |
| `quality` | web-testing, agent-browser, chrome-profile, deep-swe | |
| `docs` | docs, docs-seeker, llms, mintlify, document-skills, markdown-novel-viewer, repomix, project-organization, copywriting | |
| `diagrams` | diagram, excalidraw, mermaidjs-v11, tech-graph, graphify, gkg, preview | `diagram` is 1.8 MB |
| `media` | ai-artist, ai-multimodal, media, remotion, hyperframes, design | |
| `security-intel` | cti | specialist; 1.1 MB |
| `mobile` | mobile | |

Agents (16) go to the pack that uses them with the `mk-` prefix (`mk-planner`, `mk-debugger`, `mk-tester`, `mk-code-reviewer`, ...). The prefix also avoids clashing with runtime built-in agents such as `Explore` and `Plan`.

Rules (8) become team-rule sections or skill content: `primary-workflow` and `development-rules` merge into the `workflow` pack's router skill; `orchestration-protocol` and `process-management` go to `orchestration`; `skill-domain-routing` and `skill-workflow-routing` become the pack router; `documentation-management` goes to `docs`; `review-audit-self-decision` goes to `workflow`.

## 4. Command mapping

Counts are calls found in the source skills.

| Source subcommand | Calls | max-kit target | Status |
| --- | --- | --- | --- |
| `plan create/add-phase/list/search/show/status/check/uncheck/update/use/resolve/validate/close/archive` | about 60 | `mk plan <same>` (files only, no index), plans link to features with `--feature` | done |
| `plan reindex/kanban/cleanup/publish/parse/migrate/phase` | about 18 | none: no index exists; publishing is done with `gh` | rewrite |
| `journal create/list/show/validate` | 22 | `mk journal <same>` (files in `plans/journals/`) | done |
| `doctor` | 15 | `mk doctor` | map now |
| `kit init`, `kit refresh` | 29 | `mk init`, `mk update` | map now |
| `update`, `self-update` | 49 | `npm update max-kit && mk update` | map now |
| `test optimize/classify-e2e/benchmark` | 11 | none: suite optimisation runs on repository tools | remove the CLI passages |
| `skills link/route/kit` | 203 (with below) | `mk sync`, pack config | map now |
| `skills self-improve status/history` | | `mk improve status/events` | done |
| `skills improve/evolution/kit/link`, `features list` | | none: personal kits, overlays and marketplace publishing are not part of max-kit | removed with their lanes |
| `secrets set/get/list/search/annotate/rotate/delete/compare/import-env/export/run/request/approve/grants/revoke/audit/status` | about 75 | `mk secrets <same>` (local vault) | map now |
| `secrets sync/recovery/members/remote/bundle/trust/alias/approvals` | about 59 | none until a sync server exists | rewrite: drop sync and recovery passages, keep local use |
| `config prefs resolve/get/set/unset/validate` | about 30 | `mk prefs <same>` (`resolve --json` keeps the `.prefs` shape) | done |
| `config start` and other config calls | about 19 | `max-kit.config.json` | rewrite |
| `orchestrate`, `sessions`, `watch` | 48 | `mk handoff` (Phase 5) plus runtime agents | build `handoff`, rewrite rest |
| `eval` | 30 | none: all are opt-in cloud "shadow experiment" sections | remove the section |
| `insights`, `analytics`, `features`, `agents model`, `backups`, `projects`, `login`, `content*`, `policy`, `migrate`, `render`, `mcp` | about 110 | none | rewrite or drop the passage |

## 5. Port mechanics

`scripts/port-skills.mjs` takes the source folder and the source prefix, CLI name, product name and config folder as arguments (so the repo never contains them), plus `packs/*/pack.json` for placement. For each skill it:

1. Copies the folder to `packs/<pack>/skills/mk-<name>/` (or `skills/` for core).
2. Renames the prefix in names, paths and text; maps CLI calls with the table above; renames the product name and config folder.
3. Removes the owner's licence files and front matter, and moves third-party licence text into `THIRD_PARTY_NOTICES.md`.
4. Writes a report: unmapped CLI calls, remaining source names, hook or script paths that point outside the skill, and size.

Then a person or agent rewrites what the report lists, and `mk skills lint` must pass:

- front matter has `name` (equal to the folder) and `description`; names are unique across packs;
- no source prefix, product name, CLI name or config folder anywhere;
- every `mk <command>` mentioned exists;
- links and script paths inside the skill resolve;
- size per skill under a budget (default 512 KB; larger skills list an exception in `pack.json`).

## 6. Batches

Each batch is one pull request with a harness feature, the port report in the run file, `mk skills lint` and `mk check` passing, and one smoke test per skill (it loads, and a representative prompt triggers it in Claude Code).

| Batch | Content | Depends on |
| --- | --- | --- |
| 0 | `mk` alias, pack loader and rendering, `postinstall` sync, port script, `mk skills lint`, `THIRD_PARTY_NOTICES.md` | Phase 4 |
| 1 | `workflow` pack, CLI-free skills first: advise, ask, brainstorm, bro, code-review, debug, explain, problem-solving, predict, scenario, scout, sumup, research, research-prompt, sowat, xia, fable-thinking; agents planner, debugger, code-reviewer, tester, researcher, brainstormer, advisor, explore | 0 |
| 2 | `workflow` remainder (plan, cook, fix, test, issue-to-plan, atoz) mapped to harness features and `mk verify` | 1 |
| 3 | `continuity` (handoff, journal, retro, watzup, context-engineering, ...), with `mk journal` and `mk handoff`; dogfood moves to batch 8 with `mk improve` | 2 |
| 4 | `delivery` (git, github, review-pr, ship, vibe, worktree) | 2 |
| 5 | `docs`, `diagrams` | 0 |
| 6 | `frontend`, `backend`, `mobile` | 0 |
| 7 | `ops` (after the `secrets` decision), `quality`, `media`, `security-intel` | Phase 6 |
| 8 | `orchestration`, dogfood and `mk improve` (session and guard events, session-start nudge); orchestrate deferred pending a decision | Phases 5–7 |

Hooks are not copied as files: each becomes a max-kit guard so it works in every runtime. The mapping is privacy-block and secret-output to Phase 6; context-firewall, scout-block and pre-compact to Phase 5; self-improve recorder and nudge, and the agent-behaviour linter, to Phase 7. Statusline and notification hooks are left out for now.

## 7. Decisions

Decided (2026-11-27):

1. `secrets`: max-kit has its own local vault (`mk secrets`). Cross-device sync, recovery and shared vault members wait for a sync server.
2. Licence: none for now (`UNLICENSED`); a public licence can be added later.
3. Large packs ship in this repo.
