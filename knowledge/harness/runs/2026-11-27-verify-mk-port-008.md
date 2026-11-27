---
features:
  - MK-PORT-008
date: 2026-11-27
result: passed
tier: low
repo: knowledgebase
commit: 31d916a
branch: feat/port-ops-quality-media
dirty: false
recorded_by: max-kit verify
covers:
  - AC3
  - AC1
---

# Run 2026-11-27: verify MK-PORT-008

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass; check passed with forbidden patterns active.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC3
- Exit: 0, 64.3s

```text
... 646 earlier line(s) omitted
✔ new hand-written migration is denied with the repo generator (59.014083ms)
✔ risky commands ask, extended patterns apply, safe commands pass (20.117833ms)
✔ deny wins over ask in the same command (30.659292ms)
✔ disabled guards do not run (26.683ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (220.412292ms)
✔ the hook command fails open on a bad payload (85.382208ms)
✔ a fresh knowledgebase passes the full check (49.463375ms)
✔ init fills project values but keeps template placeholders (22.417041ms)
✔ passing without evidence is an error (23.106792ms)
✔ blocked needs a blocker, ids must match the prefix (26.079583ms)
✔ new feature and run, then evidence makes passing valid (45.356958ms)
✔ stale generated index and log are detected and fixed (34.58125ms)
✔ broken links and edited generated files fail the check (31.947375ms)
✔ boot budget and duplicated rules fail the check (33.775333ms)
✔ test/helpers.mjs (68.437708ms)
✔ journal create redacts, records context, and lists newest first (1005.611375ms)
✔ journal refuses empty bodies and validate flags bad entries (516.741416ms)
✔ handoff reports repo, plan and harness state (776.312292ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (461.532875ms)
✔ pr-body check requires the contract sections; --loose skips traceability (223.05575ms)
✔ transform renames, maps exact commands and reports the rest (2.521209ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (76.291041ms)
✔ skills lint checks names, references, commands and forbidden names (13.092459ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (75.723375ms)
✔ rename-skill moves the folder and rewrites references, slash commands and paths (4.051541ms)
✔ create scaffolds plan and phases, makes it current, and validates (407.18625ms)
✔ check moves phase status and progress; the table regenerates (720.048375ms)
✔ update completed warns about open items; close hides the plan from resolve (742.596416ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (1071.760791ms)
✔ validate catches broken phase files (230.994125ms)
✔ completing a plan warns when its harness feature is not passing (261.741417ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (351.585625ms)
✔ set reads stdin, never prints the value, and stores it encrypted (74.596666ms)
✔ literal values, duplicates and short values are refused (210.214084ms)
✔ get, search, list, annotate and rotate work on metadata only (382.729459ms)
✔ compare answers match or differs without printing values (183.221583ms)
✔ import-env plans without values, skips examples and existing refs (176.58825ms)
✔ run injects values for the user and redacts them in output (223.533417ms)
✔ an agent needs a user grant; once grants are used up (732.417458ms)
✔ reveal and delete are guarded; the audit log never holds values (368.816708ms)
✔ the secret-store choice is recorded per project or per user (376.463666ms)
✔ the secrets guard blocks agents from reading secret files (18.128417ms)
✔ passing verification records evidence and marks the feature passing (283.4995ms)
✔ a second verify on the same day gets its own run file (310.13375ms)
✔ failing verification records a failed run and demotes passing (198.455125ms)
✔ open unknowns or a dirty repo keep the feature from passing (300.047625ms)
✔ risky commands need --allow-risky; manual features cannot be verified (228.866917ms)
✔ watched paths changing after the verified commit make evidence stale (367.681542ms)
✔ the newest same-day run decides freshness, not file-name order (391.459208ms)
✔ evidence naming a commit that does not exist is reported (216.571709ms)
✔ acceptance criteria must be covered and covers must exist (109.723916ms)
✔ redaction covers common secret shapes (0.190833ms)
ℹ tests 267
ℹ suites 11
ℹ pass 267
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64088.63375
```

### 2. `npm run check`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 1.2s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  96 skill(s) in core and 13 pack(s), 23 forbidden pattern(s)
skills lint: passed with 3 warning(s)
  16 feature(s)
harness lint: passed
  13 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 4 warning(s)
feature index: passed
log rollup: passed
  58 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed

  warn: mk-skill-creator is planned but not ported yet; referenced by mk-autoresearch, mk-page-builder, mk-fable-thinking
  warn: mk-orchestrate is planned but not ported yet; referenced by mk-codex-goal, mk-handoff, mk-vibe, mk-atoz, mk-scout
  warn: mk-project-management is planned but not ported yet; referenced by mk-fix
  warn: features/MK-PACKS-001.yml: watched paths changed since the verified commit 240c7e2 (scripts/port-skills.mjs); run npm run verify -- MK-PACKS-001
  warn: features/MK-PORT-004.yml: watched paths changed since the verified commit 9c32d02 (scripts/port-skills.mjs); run npm run verify -- MK-PORT-004
  warn: features/MK-PORT-005.yml: watched paths changed since the verified commit 9576769 (packs/diagrams/skills/mk-preview/references/html-antv-infographic.md, packs/diagrams/skills/mk-preview/references/html-libraries.md, packs/diagrams/skills/mk-preview/references/html-skill-composition.md and 1 more); run npm run verify -- MK-PORT-005
  warn: features/MK-PORT-006.yml: watched paths changed since the verified commit 240c7e2 (packs/frontend/skills/mk-frontend-design/references/asset-pipeline.md); run npm run verify -- MK-PORT-006
```

## Result

All commands exited 0.
