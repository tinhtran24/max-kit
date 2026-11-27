---
features:
  - MK-PORT-002
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: b7f3e4a
branch: feat/port-workflow-2
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
  - AC2
  - AC3
---

# Run 2026-11-27: verify MK-PORT-002

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass including test/plan.test.mjs; check passed with forbidden patterns active.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC1, AC2
- Exit: 0, 3.9s

```text
... 38 earlier line(s) omitted
✔ the migration message names the container (89.210333ms)
✔ profile risky commands apply to repos of that stack (84.441875ms)
✔ session start injects read order and team rules (108.267916ms)
✔ hooks stay silent outside a knowledgebase (1.056125ms)
✔ push to a protected branch is denied, task branch allowed (37.301875ms)
✔ push with no refspec uses the repo's current branch (579.007375ms)
✔ edits on a deploy branch are denied (249.100459ms)
✔ new hand-written migration is denied with the repo generator (46.393041ms)
✔ risky commands ask, extended patterns apply, safe commands pass (13.314917ms)
✔ deny wins over ask in the same command (12.06675ms)
✔ disabled guards do not run (10.606875ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (139.041834ms)
✔ the hook command fails open on a bad payload (77.748208ms)
✔ a fresh knowledgebase passes the full check (94.196833ms)
✔ init fills project values but keeps template placeholders (50.599958ms)
✔ passing without evidence is an error (39.017708ms)
✔ blocked needs a blocker, ids must match the prefix (17.83975ms)
✔ new feature and run, then evidence makes passing valid (53.742958ms)
✔ stale generated index and log are detected and fixed (39.105833ms)
✔ broken links and edited generated files fail the check (38.649542ms)
✔ boot budget and duplicated rules fail the check (72.475583ms)
✔ test/helpers.mjs (70.336667ms)
✔ transform renames, maps exact commands and reports the rest (4.290917ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (123.464458ms)
✔ skills lint checks names, references, commands and forbidden names (65.00525ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (142.9785ms)
✔ create scaffolds plan and phases, makes it current, and validates (688.432083ms)
✔ check moves phase status and progress; the table regenerates (665.180208ms)
✔ update completed warns about open items; close hides the plan from resolve (529.654208ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (704.295209ms)
✔ validate catches broken phase files (179.097083ms)
✔ completing a plan warns when its harness feature is not passing (226.515875ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (303.312291ms)
✔ set reads stdin, never prints the value, and stores it encrypted (134.439084ms)
✔ literal values, duplicates and short values are refused (408.208083ms)
✔ get, search, list, annotate and rotate work on metadata only (376.439459ms)
✔ compare answers match or differs without printing values (186.267583ms)
✔ import-env plans without values, skips examples and existing refs (170.214ms)
✔ run injects values for the user and redacts them in output (169.5915ms)
✔ an agent needs a user grant; once grants are used up (534.060208ms)
✔ reveal and delete are guarded; the audit log never holds values (241.308083ms)
✔ the secret-store choice is recorded per project or per user (256.91775ms)
✔ the secrets guard blocks agents from reading secret files (11.9785ms)
✔ passing verification records evidence and marks the feature passing (289.195041ms)
✔ a second verify on the same day gets its own run file (311.395ms)
✔ failing verification records a failed run and demotes passing (170.783ms)
✔ open unknowns or a dirty repo keep the feature from passing (221.677416ms)
✔ risky commands need --allow-risky; manual features cannot be verified (129.692583ms)
✔ watched paths changing after the verified commit make evidence stale (259.280541ms)
✔ evidence naming a commit that does not exist is reported (148.84875ms)
✔ acceptance criteria must be covered and covers must exist (68.33625ms)
✔ redaction covers common secret shapes (0.276ms)
ℹ tests 86
ℹ suites 0
ℹ pass 86
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3705.581041
```

### 2. `npm run check`

- Repo: knowledgebase
- Covers: AC3
- Exit: 0, 0.3s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  26 skill(s) in core and 13 pack(s), 8 forbidden pattern(s)
skills lint: passed with 35 warning(s)
  10 feature(s)
harness lint: passed
  7 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 1 warning(s)
feature index: passed
log rollup: passed
  33 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed

  warn: mk-diagram is planned but not ported yet; referenced by mk-advise, mk-brainstorm, mk-explain, mk-issue-to-plan, mk-plan
  warn: mk-frontend-design is planned but not ported yet; referenced by mk-advise, mk-bootstrap, mk-brainstorm, mk-explain, mk-fable-thinking, mk-fix, mk-issue-to-plan, mk-plan
  warn: mk-preview is planned but not ported yet; referenced by mk-advise, mk-brainstorm, mk-explain
  warn: mk-goal-warmup is planned but not ported yet; referenced by mk-atoz
  warn: mk-ship is planned but not ported yet; referenced by mk-atoz, mk-brainstorm, mk-code-review
  warn: mk-orchestrate is planned but not ported yet; referenced by mk-atoz, mk-scout
  warn: mk-review-pr is planned but not ported yet; referenced by mk-atoz, mk-brainstorm
  warn: mk-vibe is planned but not ported yet; referenced by mk-atoz, mk-plan
  warn: mk-enhance-ux-ax is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-github is planned but not ported yet; referenced by mk-bootstrap
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
  warn: mk-skill-creator is planned but not ported yet; referenced by mk-fable-thinking
  warn: mk-context-engineering is planned but not ported yet; referenced by mk-fable-thinking
  warn: mk-project-management is planned but not ported yet; referenced by mk-fix
  warn: mk-ui-ux-pro-max is planned but not ported yet; referenced by mk-fix
  warn: mk-git is planned but not ported yet; referenced by mk-test
  warn: features/MK-PACKS-001.yml: watched paths changed since the verified commit d4288fd (scripts/port-skills.mjs, src/core/skills-lint.mjs); run npm run verify -- MK-PACKS-001
```

## Result

All commands exited 0.
