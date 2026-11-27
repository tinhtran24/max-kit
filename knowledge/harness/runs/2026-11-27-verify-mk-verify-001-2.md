---
features:
  - MK-VERIFY-001
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: 662ec13
branch: feat/port-workflow-2
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
  - AC2
  - AC3
---

# Run 2026-11-27: verify MK-VERIFY-001

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass, including test/verify.test.mjs; check passed.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC1, AC2, AC3
- Exit: 0, 4.8s

```text
... 39 earlier line(s) omitted
✔ profile risky commands apply to repos of that stack (143.531459ms)
✔ session start injects read order and team rules (75.992375ms)
✔ hooks stay silent outside a knowledgebase (0.649333ms)
✔ push to a protected branch is denied, task branch allowed (59.185334ms)
✔ push with no refspec uses the repo's current branch (351.141375ms)
✔ edits on a deploy branch are denied (466.182292ms)
✔ new hand-written migration is denied with the repo generator (42.316542ms)
✔ risky commands ask, extended patterns apply, safe commands pass (26.399667ms)
✔ deny wins over ask in the same command (18.093333ms)
✔ disabled guards do not run (20.174375ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (243.439959ms)
✔ the hook command fails open on a bad payload (71.27325ms)
✔ a fresh knowledgebase passes the full check (71.350959ms)
✔ init fills project values but keeps template placeholders (29.138916ms)
✔ passing without evidence is an error (35.682958ms)
✔ blocked needs a blocker, ids must match the prefix (27.022042ms)
✔ new feature and run, then evidence makes passing valid (45.463958ms)
✔ stale generated index and log are detected and fixed (26.837958ms)
✔ broken links and edited generated files fail the check (31.133417ms)
✔ boot budget and duplicated rules fail the check (38.218375ms)
✔ test/helpers.mjs (109.508959ms)
✔ transform renames, maps exact commands and reports the rest (1.545375ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (97.086583ms)
✔ skills lint checks names, references, commands and forbidden names (12.060709ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (91.097958ms)
✔ create scaffolds plan and phases, makes it current, and validates (670.305042ms)
✔ check moves phase status and progress; the table regenerates (859.189125ms)
✔ update completed warns about open items; close hides the plan from resolve (660.111166ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (981.402167ms)
✔ validate catches broken phase files (213.927833ms)
✔ completing a plan warns when its harness feature is not passing (278.4775ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (423.063333ms)
✔ set reads stdin, never prints the value, and stores it encrypted (92.023209ms)
✔ literal values, duplicates and short values are refused (330.134084ms)
✔ get, search, list, annotate and rotate work on metadata only (595.217042ms)
✔ compare answers match or differs without printing values (222.705917ms)
✔ import-env plans without values, skips examples and existing refs (195.486375ms)
✔ run injects values for the user and redacts them in output (232.944584ms)
✔ an agent needs a user grant; once grants are used up (657.181167ms)
✔ reveal and delete are guarded; the audit log never holds values (332.425625ms)
✔ the secret-store choice is recorded per project or per user (407.874417ms)
✔ the secrets guard blocks agents from reading secret files (21.0175ms)
✔ passing verification records evidence and marks the feature passing (501.08775ms)
✔ a second verify on the same day gets its own run file (414.398792ms)
✔ failing verification records a failed run and demotes passing (233.567291ms)
✔ open unknowns or a dirty repo keep the feature from passing (300.436917ms)
✔ risky commands need --allow-risky; manual features cannot be verified (195.525458ms)
✔ watched paths changing after the verified commit make evidence stale (312.027959ms)
✔ the newest same-day run decides freshness, not file-name order (328.512458ms)
✔ evidence naming a commit that does not exist is reported (201.747875ms)
✔ acceptance criteria must be covered and covers must exist (100.130417ms)
✔ redaction covers common secret shapes (0.246958ms)
ℹ tests 87
ℹ suites 0
ℹ pass 87
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4576.927625
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 0, 0.5s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  26 skill(s) in core and 13 pack(s), 8 forbidden pattern(s)
skills lint: passed with 35 warning(s)
  10 feature(s)
harness lint: passed
  8 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 1 warning(s)
feature index: passed
log rollup: passed
  36 markdown file(s)
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
  warn: features/MK-VERIFY-001.yml: watched paths changed since the verified commit ded8be2 (src/core/harness/freshness.mjs); run npm run verify -- MK-VERIFY-001
```

## Result

All commands exited 0.
