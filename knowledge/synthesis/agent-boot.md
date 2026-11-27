# Agent Boot

The slim boot path. Open longer files only when the task needs them. Team rules are in `team-rules.md` and are not repeated here.

## Workspace

- Project settings: `max-kit.config.json` (repos, protected and deploy branches, guard patterns, runtimes).
- App checkouts sit beside `knowledge/` and are read-only for knowledge tasks unless the user asks for code changes.
- Business conclusions go in `business/`, captured evidence in `raw/`, production failures in `incidents/`.
- Current-code questions (symbols, callers, impact) are answered from the code or a code-index tool, not from wiki pages. When the wiki and the code disagree, the code wins: record the mismatch in `maintenance/conflicts.md`.

## Harness default

For any non-trivial task:

1. Find the feature in `harness/features-index.md`; open only `harness/features/<ID>.yml`.
2. No match and a real trigger exists: `npm run new:feature -- <ID> "<title>" <area>` (starts as `draft`).
3. Set the feature to `active` while working; update `updated_at`.
4. Verify by the feature's commands or protocol.
5. Record evidence: `npm run new:run -- <ID> <slug>`, fill the front matter (`result`, `commit`, `tier`).
6. Mark `passing` only when verification passed and the run file exists. Otherwise `blocked` with a `blocker`.
7. Run `npm run check`.

## Routing

| Question | Go to |
| --- | --- |
| What does X mean for the business | `business/index.md` |
| Why was X decided | `business/decisions/` |
| What proves X works | `harness/features/<ID>.yml` and its runs |
| What went wrong in production | `incidents/_index.md` |
| What is unresolved | `maintenance/open-questions.md`, `maintenance/conflicts.md` |
| What changed recently | `synthesis/recent-changes.md`, then `log/` |

## Escalate

- Edit policy and workflows: `knowledge/README.md`
- Harness rules and state machine: `knowledge/harness/README.md`
