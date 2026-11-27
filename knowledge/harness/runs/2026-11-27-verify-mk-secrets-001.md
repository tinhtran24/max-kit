---
features:
  - MK-SECRETS-001
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: ce1b581
branch: feat/secrets-vault
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
  - AC2
  - AC3
---

# Run 2026-11-27: verify MK-SECRETS-001

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass including test/secrets.test.mjs; check passed.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC1, AC2, AC3
- Exit: 0, 2.5s

```text
... 31 earlier line(s) omitted
✔ init --detect on a folder with one stack sets the project profile (83.802417ms)
✔ migration guard blocks a hand-written file for rails-rspec (92.286541ms)
✔ migration guard blocks a hand-written file for laravel (83.392084ms)
✔ migration guard blocks a hand-written file for django (126.388584ms)
✔ migration guard blocks a hand-written file for go-goose (85.978375ms)
✔ migration guard blocks a hand-written file for node-prisma-pnpm (86.716916ms)
✔ migration guard blocks a hand-written file for php-dbmate (72.339333ms)
✔ the migration message names the container (69.337583ms)
✔ profile risky commands apply to repos of that stack (67.498416ms)
✔ session start injects read order and team rules (116.267958ms)
✔ hooks stay silent outside a knowledgebase (1.235458ms)
✔ push to a protected branch is denied, task branch allowed (18.62725ms)
✔ push with no refspec uses the repo's current branch (211.835042ms)
✔ edits on a deploy branch are denied (169.033583ms)
✔ new hand-written migration is denied with the repo generator (22.562625ms)
✔ risky commands ask, extended patterns apply, safe commands pass (9.702083ms)
✔ deny wins over ask in the same command (11.562125ms)
✔ disabled guards do not run (9.223792ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (143.14475ms)
✔ the hook command fails open on a bad payload (47.050875ms)
✔ a fresh knowledgebase passes the full check (64.665875ms)
✔ init fills project values but keeps template placeholders (9.176375ms)
✔ passing without evidence is an error (20.355542ms)
✔ blocked needs a blocker, ids must match the prefix (27.360958ms)
✔ new feature and run, then evidence makes passing valid (43.559417ms)
✔ stale generated index and log are detected and fixed (22.291542ms)
✔ broken links and edited generated files fail the check (31.068125ms)
✔ boot budget and duplicated rules fail the check (35.978042ms)
✔ test/helpers.mjs (94.443584ms)
✔ transform renames, maps exact commands and reports the rest (1.411709ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (67.172625ms)
✔ skills lint checks names, references, commands and forbidden names (15.971542ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (77.55425ms)
✔ set reads stdin, never prints the value, and stores it encrypted (70.464833ms)
✔ literal values, duplicates and short values are refused (170.444625ms)
✔ get, search, list, annotate and rotate work on metadata only (295.890916ms)
✔ compare answers match or differs without printing values (164.703667ms)
✔ import-env plans without values, skips examples and existing refs (131.373625ms)
✔ run injects values for the user and redacts them in output (142.385834ms)
✔ an agent needs a user grant; once grants are used up (484.06025ms)
✔ reveal and delete are guarded; the audit log never holds values (237.3735ms)
✔ the secret-store choice is recorded per project or per user (251.674125ms)
✔ the secrets guard blocks agents from reading secret files (14.337333ms)
✔ passing verification records evidence and marks the feature passing (210.100958ms)
✔ a second verify on the same day gets its own run file (238.798375ms)
✔ failing verification records a failed run and demotes passing (161.744667ms)
✔ open unknowns or a dirty repo keep the feature from passing (183.387ms)
✔ risky commands need --allow-risky; manual features cannot be verified (117.676042ms)
✔ watched paths changing after the verified commit make evidence stale (228.304583ms)
✔ evidence naming a commit that does not exist is reported (120.708667ms)
✔ acceptance criteria must be covered and covers must exist (63.613166ms)
✔ redaction covers common secret shapes (0.152791ms)
ℹ tests 79
ℹ suites 0
ℹ pass 79
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2246.438917
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 0, 0.3s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  16 skill(s) in core and 13 pack(s), 4 forbidden pattern(s)
skills lint: passed with 20 warning(s)
  9 feature(s)
harness lint: passed
  6 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 1 warning(s)
feature index: passed
log rollup: passed
  32 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed

  warn: mk-advise is planned but not ported yet; referenced by mk-atoz
  warn: mk-goal-warmup is planned but not ported yet; referenced by mk-atoz
  warn: mk-plan is planned but not ported yet; referenced by mk-atoz, mk-predict
  warn: mk-cook is planned but not ported yet; referenced by mk-atoz, mk-predict
  warn: mk-ship is planned but not ported yet; referenced by mk-atoz
  warn: mk-orchestrate is planned but not ported yet; referenced by mk-atoz, mk-scout
  warn: mk-code-review is planned but not ported yet; referenced by mk-atoz
  warn: mk-review-pr is planned but not ported yet; referenced by mk-atoz
  warn: mk-vibe is planned but not ported yet; referenced by mk-atoz
  warn: mk-preview is planned but not ported yet; referenced by mk-explain
  warn: mk-frontend-design is planned but not ported yet; referenced by mk-explain, mk-fable-thinking, mk-issue-to-plan
  warn: mk-diagram is planned but not ported yet; referenced by mk-explain, mk-issue-to-plan
  warn: mk-fix is planned but not ported yet; referenced by mk-fable-thinking
  warn: mk-skill-creator is planned but not ported yet; referenced by mk-fable-thinking
  warn: mk-brainstorm is planned but not ported yet; referenced by mk-fable-thinking
  warn: mk-context-engineering is planned but not ported yet; referenced by mk-fable-thinking
  warn: mk-debug is planned but not ported yet; referenced by mk-predict
  warn: mk-scenario is planned but not ported yet; referenced by mk-predict
  warn: mk-docs-seeker is planned but not ported yet; referenced by mk-research
  warn: mk-bootstrap is planned but not ported yet; referenced by mk-xia
  warn: features/MK-PACKS-001.yml: watched paths changed since the verified commit d4288fd (scripts/port-skills.mjs, src/core/skills-lint.mjs); run npm run verify -- MK-PACKS-001
```

## Result

All commands exited 0.
