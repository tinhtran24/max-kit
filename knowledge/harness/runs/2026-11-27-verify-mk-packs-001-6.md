---
features:
  - MK-PACKS-001
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: b3cec90
branch: feat/port-docs-diagrams
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
  - AC2
  - AC3
---

# Run 2026-11-27: verify MK-PACKS-001

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass including test/packs.test.mjs; check passed (includes skills lint).

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC1, AC2, AC3
- Exit: 0, 16.2s

```text
... 561 earlier line(s) omitted
✔ edits on a deploy branch are denied (257.36ms)
✔ new hand-written migration is denied with the repo generator (48.125542ms)
✔ risky commands ask, extended patterns apply, safe commands pass (13.273458ms)
✔ deny wins over ask in the same command (9.723917ms)
✔ disabled guards do not run (21.086625ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (167.404292ms)
✔ the hook command fails open on a bad payload (71.3575ms)
✔ a fresh knowledgebase passes the full check (51.641ms)
✔ init fills project values but keeps template placeholders (10.874959ms)
✔ passing without evidence is an error (17.395459ms)
✔ blocked needs a blocker, ids must match the prefix (17.352875ms)
✔ new feature and run, then evidence makes passing valid (46.057542ms)
✔ stale generated index and log are detected and fixed (23.807792ms)
✔ broken links and edited generated files fail the check (24.729625ms)
✔ boot budget and duplicated rules fail the check (30.367291ms)
✔ test/helpers.mjs (62.576333ms)
✔ journal create redacts, records context, and lists newest first (973.525084ms)
✔ journal refuses empty bodies and validate flags bad entries (416.423291ms)
✔ handoff reports repo, plan and harness state (647.463875ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (408.887791ms)
✔ pr-body check requires the contract sections; --loose skips traceability (224.149208ms)
✔ transform renames, maps exact commands and reports the rest (5.420167ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (62.073916ms)
✔ skills lint checks names, references, commands and forbidden names (14.692875ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (75.720334ms)
✔ create scaffolds plan and phases, makes it current, and validates (354.921166ms)
✔ check moves phase status and progress; the table regenerates (598.200916ms)
✔ update completed warns about open items; close hides the plan from resolve (615.243917ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (851.683041ms)
✔ validate catches broken phase files (189.338292ms)
✔ completing a plan warns when its harness feature is not passing (232.020666ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (346.383458ms)
✔ set reads stdin, never prints the value, and stores it encrypted (63.299167ms)
✔ literal values, duplicates and short values are refused (209.442583ms)
✔ get, search, list, annotate and rotate work on metadata only (329.817917ms)
✔ compare answers match or differs without printing values (159.051125ms)
✔ import-env plans without values, skips examples and existing refs (158.053875ms)
✔ run injects values for the user and redacts them in output (195.413292ms)
✔ an agent needs a user grant; once grants are used up (600.289792ms)
✔ reveal and delete are guarded; the audit log never holds values (319.258208ms)
✔ the secret-store choice is recorded per project or per user (316.928875ms)
✔ the secrets guard blocks agents from reading secret files (13.56375ms)
✔ passing verification records evidence and marks the feature passing (236.31975ms)
✔ a second verify on the same day gets its own run file (279.853541ms)
✔ failing verification records a failed run and demotes passing (165.980875ms)
✔ open unknowns or a dirty repo keep the feature from passing (263.534458ms)
✔ risky commands need --allow-risky; manual features cannot be verified (196.602958ms)
✔ watched paths changing after the verified commit make evidence stale (329.10925ms)
✔ the newest same-day run decides freshness, not file-name order (315.831667ms)
✔ evidence naming a commit that does not exist is reported (183.062208ms)
✔ acceptance criteria must be covered and covers must exist (82.362459ms)
✔ redaction covers common secret shapes (0.207834ms)
ℹ tests 243
ℹ suites 11
ℹ pass 243
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 16091.926417
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 0, 0.6s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  59 skill(s) in core and 13 pack(s), 13 forbidden pattern(s)
skills lint: passed with 29 warning(s)
  13 feature(s)
harness lint: passed
  10 passing feature(s) with a resolvable evidence commit
evidence freshness: passed
feature index: passed
log rollup: passed
  50 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed

  warn: mk-security is planned but not ported yet; referenced by mk-autoresearch, mk-github
  warn: mk-skill-creator is planned but not ported yet; referenced by mk-autoresearch, mk-fable-thinking
  warn: mk-orchestrate is planned but not ported yet; referenced by mk-codex-goal, mk-handoff, mk-vibe, mk-atoz, mk-scout
  warn: mk-design is planned but not ported yet; referenced by mk-journal
  warn: mk-frontend-design is planned but not ported yet; referenced by mk-journal, mk-retro, mk-preview, mk-advise, mk-bootstrap, mk-brainstorm, mk-explain, mk-fable-thinking, mk-fix, mk-issue-to-plan, mk-plan
  warn: mk-hyperframes is planned but not ported yet; referenced by mk-journal
  warn: mk-remotion is planned but not ported yet; referenced by mk-journal
  warn: mk-cti-expert is planned but not ported yet; referenced by mk-preview
  warn: mk-show-off is planned but not ported yet; referenced by mk-preview
  warn: mk-web-frameworks is planned but not ported yet; referenced by mk-llms, mk-bootstrap
  warn: mk-enhance-ux-ax is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-frontend-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-mobile-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-backend-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-mcp-builder is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-webmcp is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-agentize is planned but not ported yet; referenced by mk-bootstrap, mk-brainstorm
  warn: mk-deploy is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-devops is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-page-builder is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-better-auth is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-databases is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-payment-integration is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-ai-multimodal is planned but not ported yet; referenced by mk-bootstrap, mk-fix, mk-test
  warn: mk-agent-browser is planned but not ported yet; referenced by mk-bootstrap, mk-debug, mk-fix, mk-test
  warn: mk-web-testing is planned but not ported yet; referenced by mk-bootstrap, mk-test
  warn: mk-chrome-profile is planned but not ported yet; referenced by mk-debug, mk-test
  warn: mk-project-management is planned but not ported yet; referenced by mk-fix
  warn: mk-ui-ux-pro-max is planned but not ported yet; referenced by mk-fix
```

## Result

All commands exited 0.
