---
features:
  - MK-PORT-007
date: 2026-11-27
result: failed
tier: low
repo: knowledgebase
commit: 1b94617
branch: feat/port-backend-mobile
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
---

# Run 2026-11-27: verify MK-PORT-007

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass; check passed with forbidden patterns active.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Exit: 0, 64.0s

```text
... 639 earlier line(s) omitted
✔ new hand-written migration is denied with the repo generator (30.629167ms)
✔ risky commands ask, extended patterns apply, safe commands pass (16.005292ms)
✔ deny wins over ask in the same command (8.600959ms)
✔ disabled guards do not run (11.709834ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (167.476709ms)
✔ the hook command fails open on a bad payload (66.830792ms)
✔ a fresh knowledgebase passes the full check (158.6475ms)
✔ init fills project values but keeps template placeholders (51.028583ms)
✔ passing without evidence is an error (23.763208ms)
✔ blocked needs a blocker, ids must match the prefix (18.670708ms)
✔ new feature and run, then evidence makes passing valid (32.592958ms)
✔ stale generated index and log are detected and fixed (20.950833ms)
✔ broken links and edited generated files fail the check (15.688834ms)
✔ boot budget and duplicated rules fail the check (31.272541ms)
✔ test/helpers.mjs (55.970292ms)
✔ journal create redacts, records context, and lists newest first (889.938333ms)
✔ journal refuses empty bodies and validate flags bad entries (563.485209ms)
✔ handoff reports repo, plan and harness state (753.741916ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (412.112084ms)
✔ pr-body check requires the contract sections; --loose skips traceability (150.949375ms)
✔ transform renames, maps exact commands and reports the rest (2.621292ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (61.850708ms)
✔ skills lint checks names, references, commands and forbidden names (14.258042ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (62.521792ms)
✔ rename-skill moves the folder and rewrites references, slash commands and paths (4.626834ms)
✔ create scaffolds plan and phases, makes it current, and validates (374.392542ms)
✔ check moves phase status and progress; the table regenerates (795.541ms)
✔ update completed warns about open items; close hides the plan from resolve (714.786875ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (832.221417ms)
✔ validate catches broken phase files (181.446125ms)
✔ completing a plan warns when its harness feature is not passing (234.231833ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (306.665041ms)
✔ set reads stdin, never prints the value, and stores it encrypted (115.418292ms)
✔ literal values, duplicates and short values are refused (170.518458ms)
✔ get, search, list, annotate and rotate work on metadata only (372.132208ms)
✔ compare answers match or differs without printing values (268.58ms)
✔ import-env plans without values, skips examples and existing refs (210.244209ms)
✔ run injects values for the user and redacts them in output (206.085625ms)
✔ an agent needs a user grant; once grants are used up (695.910667ms)
✔ reveal and delete are guarded; the audit log never holds values (268.724166ms)
✔ the secret-store choice is recorded per project or per user (305.040208ms)
✔ the secrets guard blocks agents from reading secret files (16.011959ms)
✔ passing verification records evidence and marks the feature passing (246.0265ms)
✔ a second verify on the same day gets its own run file (413.421125ms)
✔ failing verification records a failed run and demotes passing (226.512625ms)
✔ open unknowns or a dirty repo keep the feature from passing (285.222375ms)
✔ risky commands need --allow-risky; manual features cannot be verified (207.313583ms)
✔ watched paths changing after the verified commit make evidence stale (341.058084ms)
✔ the newest same-day run decides freshness, not file-name order (306.155125ms)
✔ evidence naming a commit that does not exist is reported (161.573334ms)
✔ acceptance criteria must be covered and covers must exist (81.285667ms)
✔ redaction covers common secret shapes (0.182125ms)
ℹ tests 260
ℹ suites 11
ℹ pass 260
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 63800.109542
```

### 2. `npm run check`

- Repo: knowledgebase
- Covers: AC1
- Exit: 1, 1.0s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  82 skill(s) in core and 13 pack(s), 21 forbidden pattern(s)
skills lint: failed (1 error(s))
  15 feature(s)
harness lint: passed
  12 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 1 warning(s)
feature index: passed
log rollup: passed
  55 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check failed

  warn: mk-security is planned but not ported yet; referenced by mk-autoresearch, mk-github
  warn: mk-skill-creator is planned but not ported yet; referenced by mk-autoresearch, mk-page-builder, mk-fable-thinking
  warn: mk-orchestrate is planned but not ported yet; referenced by mk-codex-goal, mk-handoff, mk-vibe, mk-atoz, mk-scout
  warn: mk-design is planned but not ported yet; referenced by mk-journal
  warn: mk-hyperframes is planned but not ported yet; referenced by mk-journal
  warn: mk-remotion is planned but not ported yet; referenced by mk-journal
  warn: mk-cti-expert is planned but not ported yet; referenced by mk-preview
  warn: mk-ai-multimodal is planned but not ported yet; referenced by mk-frontend-design, mk-bootstrap, mk-fix, mk-test
  warn: mk-agent-browser is planned but not ported yet; referenced by mk-frontend-design, mk-webmcp, mk-bootstrap, mk-debug, mk-fix, mk-test
  warn: mk-chrome-profile is planned but not ported yet; referenced by mk-frontend-design, mk-webmcp, mk-debug, mk-test
  warn: mk-deploy is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-devops is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-web-testing is planned but not ported yet; referenced by mk-bootstrap, mk-test
  warn: mk-project-management is planned but not ported yet; referenced by mk-fix
  error: packs/backend/skills/mk-payments/scripts/package.json: contains a forbidden source name (payment-integration)
  warn: features/MK-PORT-002.yml: watched paths changed since the verified commit 9576769 (packs/workflow/skills/mk-bootstrap/SKILL.md, packs/workflow/skills/mk-bootstrap/references/project-brief-checklist.md); run npm run verify -- MK-PORT-002
```

## Result

Failed: `npm run check`.
