---
features:
  - MK-PORT-004
date: 2026-11-27
result: failed
tier: high
repo: knowledgebase
commit: d2d0342
branch: feat/port-delivery
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
  - AC2
  - AC3
---

# Run 2026-11-27: verify MK-PORT-004

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass; check passed with forbidden patterns active.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC1, AC2
- Exit: 0, 16.7s

```text
... 335 earlier line(s) omitted
✔ edits on a deploy branch are denied (215.516458ms)
✔ new hand-written migration is denied with the repo generator (37.076459ms)
✔ risky commands ask, extended patterns apply, safe commands pass (16.853041ms)
✔ deny wins over ask in the same command (11.580959ms)
✔ disabled guards do not run (14.068833ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (143.956375ms)
✔ the hook command fails open on a bad payload (52.725833ms)
✔ a fresh knowledgebase passes the full check (46.719625ms)
✔ init fills project values but keeps template placeholders (24.195916ms)
✔ passing without evidence is an error (14.578584ms)
✔ blocked needs a blocker, ids must match the prefix (10.655417ms)
✔ new feature and run, then evidence makes passing valid (34.437833ms)
✔ stale generated index and log are detected and fixed (26.503875ms)
✔ broken links and edited generated files fail the check (18.345458ms)
✔ boot budget and duplicated rules fail the check (24.872416ms)
✔ test/helpers.mjs (45.498208ms)
✔ journal create redacts, records context, and lists newest first (826.390583ms)
✔ journal refuses empty bodies and validate flags bad entries (586.379959ms)
✔ handoff reports repo, plan and harness state (778.89825ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (312.593291ms)
✔ pr-body check requires the contract sections; --loose skips traceability (209.216166ms)
✔ transform renames, maps exact commands and reports the rest (1.816ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (60.902708ms)
✔ skills lint checks names, references, commands and forbidden names (10.501167ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (103.344666ms)
✔ create scaffolds plan and phases, makes it current, and validates (420.184917ms)
✔ check moves phase status and progress; the table regenerates (744.675958ms)
✔ update completed warns about open items; close hides the plan from resolve (717.271959ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (851.529584ms)
✔ validate catches broken phase files (253.088291ms)
✔ completing a plan warns when its harness feature is not passing (276.487ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (331.731875ms)
✔ set reads stdin, never prints the value, and stores it encrypted (79.666708ms)
✔ literal values, duplicates and short values are refused (253.61125ms)
✔ get, search, list, annotate and rotate work on metadata only (377.744041ms)
✔ compare answers match or differs without printing values (174.993ms)
✔ import-env plans without values, skips examples and existing refs (217.477209ms)
✔ run injects values for the user and redacts them in output (287.379959ms)
✔ an agent needs a user grant; once grants are used up (650.471667ms)
✔ reveal and delete are guarded; the audit log never holds values (293.220542ms)
✔ the secret-store choice is recorded per project or per user (312.548917ms)
✔ the secrets guard blocks agents from reading secret files (13.820833ms)
✔ passing verification records evidence and marks the feature passing (262.90525ms)
✔ a second verify on the same day gets its own run file (283.080625ms)
✔ failing verification records a failed run and demotes passing (222.819ms)
✔ open unknowns or a dirty repo keep the feature from passing (335.825958ms)
✔ risky commands need --allow-risky; manual features cannot be verified (176.02825ms)
✔ watched paths changing after the verified commit make evidence stale (332.783542ms)
✔ the newest same-day run decides freshness, not file-name order (341.374042ms)
✔ evidence naming a commit that does not exist is reported (163.682167ms)
✔ acceptance criteria must be covered and covers must exist (97.736833ms)
✔ redaction covers common secret shapes (0.209334ms)
ℹ tests 196
ℹ suites 0
ℹ pass 196
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 16474.727291
```

### 2. `npm run check`

- Repo: knowledgebase
- Covers: AC3
- Exit: 1, 0.5s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  43 skill(s) in core and 13 pack(s), 13 forbidden pattern(s)
skills lint: passed with 34 warning(s)
  12 feature(s)
harness lint: passed
  9 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 2 warning(s)
feature index: failed (1 error(s))
log rollup: passed
  42 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check failed

  warn: mk-security is planned but not ported yet; referenced by mk-autoresearch, mk-github
  warn: mk-skill-creator is planned but not ported yet; referenced by mk-autoresearch, mk-fable-thinking
  warn: mk-orchestrate is planned but not ported yet; referenced by mk-codex-goal, mk-handoff, mk-vibe, mk-atoz, mk-scout
  warn: mk-docs is planned but not ported yet; referenced by mk-folder-context, mk-interview-docs
  warn: mk-design is planned but not ported yet; referenced by mk-journal
  warn: mk-frontend-design is planned but not ported yet; referenced by mk-journal, mk-retro, mk-advise, mk-bootstrap, mk-brainstorm, mk-explain, mk-fable-thinking, mk-fix, mk-issue-to-plan, mk-plan
  warn: mk-hyperframes is planned but not ported yet; referenced by mk-journal
  warn: mk-remotion is planned but not ported yet; referenced by mk-journal
  warn: mk-diagram is planned but not ported yet; referenced by mk-retro, mk-advise, mk-brainstorm, mk-explain, mk-issue-to-plan, mk-plan
  warn: mk-preview is planned but not ported yet; referenced by mk-retro, mk-advise, mk-brainstorm, mk-explain
  warn: mk-copywriting is planned but not ported yet; referenced by mk-ship
  warn: mk-enhance-ux-ax is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-web-frameworks is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-frontend-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-mobile-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-backend-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-mcp-builder is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-webmcp is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-agentize is planned but not ported yet; referenced by mk-bootstrap, mk-brainstorm
  warn: mk-deploy is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-devops is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-llms is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-page-builder is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-better-auth is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-databases is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-payment-integration is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-ai-multimodal is planned but not ported yet; referenced by mk-bootstrap, mk-fix, mk-test
  warn: mk-agent-browser is planned but not ported yet; referenced by mk-bootstrap, mk-debug, mk-fix, mk-test
  warn: mk-web-testing is planned but not ported yet; referenced by mk-bootstrap, mk-test
  warn: mk-docs-seeker is planned but not ported yet; referenced by mk-debug, mk-plan, mk-research
  warn: mk-repomix is planned but not ported yet; referenced by mk-debug
  warn: mk-chrome-profile is planned but not ported yet; referenced by mk-debug, mk-test
  warn: mk-project-management is planned but not ported yet; referenced by mk-fix
  warn: mk-ui-ux-pro-max is planned but not ported yet; referenced by mk-fix
  warn: features/MK-PACKS-001.yml: watched paths changed since the verified commit 2b751a7 (scripts/port-skills.mjs, src/core/skills-lint.mjs); run npm run verify -- MK-PACKS-001
  warn: features/MK-PORT-002.yml: watched paths changed since the verified commit 25d0067 (src/cli/prefs.mjs); run npm run verify -- MK-PORT-002
  error: harness/features-index.md is stale; run npm run index
```

## Result

Failed: `npm run check`.
