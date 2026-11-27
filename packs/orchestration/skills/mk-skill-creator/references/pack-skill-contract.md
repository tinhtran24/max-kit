# max-kit Pack Skill Contract

Read this before creating or updating a skill that ships in a max-kit pack (`packs/<pack>/skills/` in the max-kit repository). Project and user skills (see "Choosing a target") only need the frontmatter shape.

## Layout and ownership

```
packs/<pack>/
├── pack.json               # description, requires, skills, agents, maxSkillKb
├── skills/mk-<slug>/
│   ├── SKILL.md            # required; name: mk-<slug>
│   ├── references/         # optional, each under 300 lines
│   ├── scripts/            # optional, with tests beside them
│   └── assets/             # optional
└── agents/mk-<name>.md     # optional agents
```

- Names are `mk-` plus a short, descriptive slug; no product or marketing names.
- Every skill folder is listed in its pack's `pack.json` `skills`, every agent in `agents`. A pack that builds on another lists it in `requires`.
- Packs render side by side (`mk sync` writes `.claude/skills/` and `.agents/skills/`), so point to another skill's file as `../mk-<other>/references/<file>.md`, never by a bare `references/...` path, which resolves inside the current skill. Only link to skills in this pack or a pack it requires.
- Material from other authors keeps its licence: add its notice to `THIRD_PARTY_NOTICES.md` (one section per skill) instead of a licence file in the skill.

## Frontmatter the runtime reads

Runtimes read these fields; unknown fields are preserved but unused.

```yaml
---
name: mk-<slug>
description: "What it does, when to use it, what it does not cover."
when_to_use: "A precise activation condition for the routing catalog."
category: workflow
keywords: [three, to, six, nouns]
argument-hint: "<subcommand> [path] [--flag]"
metadata:
  author: max-kit
  version: "1.0.0"
  workflow:
    follows: [mk-plan]
    precedes: [mk-test]
---
```

- `name` is `mk-<slug>`, the same as the directory. Every runtime invokes the
  skill by that name (`/mk-<slug>`, `$mk-<slug>`); readers still accept the
  legacy colon-form alias of that name, but pack content never uses it.
- `when_to_use`, `category` and `keywords` are expected on every pack skill.
- Pack skills do not set `user-invocable` or `disable-model-invocation`; the
  same content test fails the build when either is present. Every kit skill is
  user-invocable and model-invocable.
- `category` is one of `workflow` (the delivery loop: plan, build, test,
  review, ship, hand off), `engineering` (building and operating software with
  a specific stack or tool), `design` (visual, interface, brand), `marketing`
  (growth, content, go-to-market), `media` (producing or transforming audio,
  video, images, documents, slides), `reasoning` (thinking protocols and
  explanation), `meta` (max-kit itself, skills, routing), or `runtime`
  (runtime-specific operating modes).
- `description` is at most 1024 characters. The block-scalar form (`>-`) is
  valid, and `quick_validate.py` measures the folded text. The length decision and
  the rest of the authoring contract are in `references/production-skill-standard.md`.
- `allowed-tools`, `license`, and `compatibility` are also read; see `references/yaml-frontmatter-reference.md`.
- `metadata.version` follows semver. Bump it on every content change so
  installed copies refresh.
- `metadata.workflow.follows` / `precedes` build the skill graph. Refs are
  canonical `mk-*` names and must resolve in the pack or a pack it requires.

## Capability vocabulary (capability lint)

Kit markdown must not name a runtime's native tools, because the same skill
is projected to runtimes with different tool names. Write the portable
capability instead:

| Write this | Instead of the native names |
|---|---|
| `ask_user capability` | AskUserQuestion |
| `web_search capability` | WebSearch, WebFetch |
| `delegate_agent capability` | Task |
| `manage_plan capability` | TodoWrite, TaskCreate, TaskGet, TaskUpdate, TaskList |
| `edit_file capability` | Edit, Write |
| `read_file capability` | Read |
| `search_files capability` | Grep, Glob |
| `run_shell capability` | Bash |

The lint matches a native name in backticks, after "Use … tool", after
"via", or followed by "(". A line that must show native syntax (for example
an `allowed-tools` example) carries the marker `capability-lint-allow:` in a
comment on that line. `scripts/quick_validate.py` checks this for pack skills.

## Python interpreter name

Pack Markdown runs scripts as `python <script>`, never bare `python3`: on stock
Windows `python3` opens the Microsoft Store stub. `python` is the name inside a
skill venv on every OS and the Windows interpreter name; agents fall back to
`python3` on macOS/Linux when `python` is missing. A command-position `python3`
is acceptable only when the same line also shows a `python` or `py -3` command.

## Validation path

1. `scripts/quick_validate.py <skill-dir>` and `scripts/lint_cruft.py <skill-dir>` from this skill.
2. `mk skills lint` in the max-kit repository: names, `pack.json` listing, references to `mk-*` skills and `mk` commands that exist, links, size budget (512 KB unless `maxSkillKb` allows more), forbidden names.
3. Script tests: name them `*.test.mjs` / `*.test.cjs` so `npm test` runs them, or keep a pytest suite under `scripts/tests/`.
4. `mk check` and, for a new pack feature, `mk verify <ID>`.

## Choosing a target

| Target | Location | Namespace | Validation |
|---|---|---|---|
| Pack skill (max-kit repository) | `packs/<pack>/skills/mk-<slug>/` | `mk-<slug>` | everything above |
| Project skill | `.claude/skills/<slug>/` (Claude Code), `.agents/skills/<slug>/` (Codex and others) | none | `quick_validate.py`, `lint_cruft.py`, consumer eval |
| User skill | the runtime's user skill directory | none | same as project |
| Marketplace / package | `package_skill.py` output | per marketplace | `references/cross-marketplace-distribution.md` |

Default to the current project; use a pack target only inside the max-kit repository, and user scope only when the user asks for it.
