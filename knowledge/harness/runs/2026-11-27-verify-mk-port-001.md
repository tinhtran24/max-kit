---
features:
  - MK-PORT-001
date: 2026-11-27
result: passed
tier: low
repo: knowledgebase
commit: 97427cb
branch: feat/skills-port
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
---

# Run 2026-11-27: verify MK-PORT-001

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

check passed with forbidden patterns active; all tests pass.

## Commands

### 1. `npm run check`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 0.4s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  15 skill(s) in core and 13 pack(s), 4 forbidden pattern(s)
skills lint: passed with 20 warning(s)
  8 feature(s)
harness lint: passed
  5 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 1 warning(s)
feature index: passed
log rollup: passed
  31 markdown file(s)
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

### 2. `npm test`

- Repo: knowledgebase
- Exit: 0, 1.9s

```text
... 21 earlier line(s) omitted
✔ protected push is denied in the codex format (31.119334ms)
✔ ask becomes deny by default because codex cannot ask (25.452834ms)
✔ askFallback warn turns ask into context and lets the call run (23.354375ms)
✔ apply_patch adding a migration is denied, updating one is allowed (248.393ms)
✔ apply_patch on a deploy branch is denied (122.154208ms)
✔ stop blocks once in the codex format (80.890584ms)
✔ a knowledgebase targeting claude and codex renders both and passes the check (9.527875ms)
✔ detection per stack matches the golden file (24.254167ms)
✔ every profile loads and inherits the generic guards (1.454583ms)
✔ detect --write adds repos and fills only empty fields (373.228292ms)
✔ init --detect on a folder with one stack sets the project profile (98.064167ms)
✔ migration guard blocks a hand-written file for rails-rspec (83.324709ms)
✔ migration guard blocks a hand-written file for laravel (90.0435ms)
✔ migration guard blocks a hand-written file for django (91.327208ms)
✔ migration guard blocks a hand-written file for go-goose (73.720708ms)
✔ migration guard blocks a hand-written file for node-prisma-pnpm (65.595292ms)
✔ migration guard blocks a hand-written file for php-dbmate (74.102166ms)
✔ the migration message names the container (66.575375ms)
✔ profile risky commands apply to repos of that stack (65.3925ms)
✔ session start injects read order and team rules (76.648958ms)
✔ hooks stay silent outside a knowledgebase (1.749375ms)
✔ push to a protected branch is denied, task branch allowed (26.728958ms)
✔ push with no refspec uses the repo's current branch (358.024583ms)
✔ edits on a deploy branch are denied (163.587375ms)
✔ new hand-written migration is denied with the repo generator (33.201417ms)
✔ risky commands ask, extended patterns apply, safe commands pass (13.32425ms)
✔ deny wins over ask in the same command (8.522208ms)
✔ disabled guards do not run (9.668792ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (112.190458ms)
✔ the hook command fails open on a bad payload (43.4195ms)
✔ a fresh knowledgebase passes the full check (74.834542ms)
✔ init fills project values but keeps template placeholders (20.205292ms)
✔ passing without evidence is an error (15.949667ms)
✔ blocked needs a blocker, ids must match the prefix (29.307208ms)
✔ new feature and run, then evidence makes passing valid (54.026958ms)
✔ stale generated index and log are detected and fixed (48.884709ms)
✔ broken links and edited generated files fail the check (47.150584ms)
✔ boot budget and duplicated rules fail the check (75.611125ms)
✔ test/helpers.mjs (108.634541ms)
✔ transform renames, maps exact commands and reports the rest (1.71075ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (90.2445ms)
✔ skills lint checks names, references, commands and forbidden names (22.54375ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (151.687667ms)
✔ passing verification records evidence and marks the feature passing (360.441958ms)
✔ a second verify on the same day gets its own run file (220.440667ms)
✔ failing verification records a failed run and demotes passing (146.264417ms)
✔ open unknowns or a dirty repo keep the feature from passing (181.24175ms)
✔ risky commands need --allow-risky; manual features cannot be verified (113.568417ms)
✔ watched paths changing after the verified commit make evidence stale (216.318167ms)
✔ evidence naming a commit that does not exist is reported (116.740208ms)
✔ acceptance criteria must be covered and covers must exist (60.569ms)
✔ redaction covers common secret shapes (0.142875ms)
ℹ tests 69
ℹ suites 0
ℹ pass 69
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1705.173667
```

## Result

All commands exited 0.
