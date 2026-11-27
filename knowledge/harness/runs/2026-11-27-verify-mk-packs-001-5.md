---
features:
  - MK-PACKS-001
date: 2026-11-27
result: failed
tier: high
repo: knowledgebase
commit: 39b82f0
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
- Exit: 0, 16.6s

```text
... 561 earlier line(s) omitted
✔ edits on a deploy branch are denied (253.636209ms)
✔ new hand-written migration is denied with the repo generator (45.104959ms)
✔ risky commands ask, extended patterns apply, safe commands pass (16.299375ms)
✔ deny wins over ask in the same command (15.912125ms)
✔ disabled guards do not run (10.843291ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (202.015583ms)
✔ the hook command fails open on a bad payload (64.904625ms)
✔ a fresh knowledgebase passes the full check (41.425292ms)
✔ init fills project values but keeps template placeholders (18.476125ms)
✔ passing without evidence is an error (18.548291ms)
✔ blocked needs a blocker, ids must match the prefix (22.7655ms)
✔ new feature and run, then evidence makes passing valid (38.828584ms)
✔ stale generated index and log are detected and fixed (28.443416ms)
✔ broken links and edited generated files fail the check (18.915458ms)
✔ boot budget and duplicated rules fail the check (30.849041ms)
✔ test/helpers.mjs (50.38025ms)
✔ journal create redacts, records context, and lists newest first (940.071208ms)
✔ journal refuses empty bodies and validate flags bad entries (473.45225ms)
✔ handoff reports repo, plan and harness state (649.854167ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (435.583ms)
✔ pr-body check requires the contract sections; --loose skips traceability (216.783958ms)
✔ transform renames, maps exact commands and reports the rest (3.090459ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (58.164ms)
✔ skills lint checks names, references, commands and forbidden names (10.990875ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (68.854958ms)
✔ create scaffolds plan and phases, makes it current, and validates (368.653917ms)
✔ check moves phase status and progress; the table regenerates (622.827583ms)
✔ update completed warns about open items; close hides the plan from resolve (702.006125ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (932.878833ms)
✔ validate catches broken phase files (204.12825ms)
✔ completing a plan warns when its harness feature is not passing (242.88025ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (344.216958ms)
✔ set reads stdin, never prints the value, and stores it encrypted (78.735ms)
✔ literal values, duplicates and short values are refused (178.910916ms)
✔ get, search, list, annotate and rotate work on metadata only (366.94425ms)
✔ compare answers match or differs without printing values (167.100334ms)
✔ import-env plans without values, skips examples and existing refs (157.963584ms)
✔ run injects values for the user and redacts them in output (188.847958ms)
✔ an agent needs a user grant; once grants are used up (736.09625ms)
✔ reveal and delete are guarded; the audit log never holds values (306.374792ms)
✔ the secret-store choice is recorded per project or per user (326.543958ms)
✔ the secrets guard blocks agents from reading secret files (16.743125ms)
✔ passing verification records evidence and marks the feature passing (258.800458ms)
✔ a second verify on the same day gets its own run file (306.087042ms)
✔ failing verification records a failed run and demotes passing (159.752833ms)
✔ open unknowns or a dirty repo keep the feature from passing (280.985042ms)
✔ risky commands need --allow-risky; manual features cannot be verified (206.324958ms)
✔ watched paths changing after the verified commit make evidence stale (406.026541ms)
✔ the newest same-day run decides freshness, not file-name order (379.265375ms)
✔ evidence naming a commit that does not exist is reported (187.360125ms)
✔ acceptance criteria must be covered and covers must exist (89.149792ms)
✔ redaction covers common secret shapes (0.245375ms)
ℹ tests 243
ℹ suites 11
ℹ pass 243
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 16434.196833
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 1, 0.5s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  59 skill(s) in core and 13 pack(s), 13 forbidden pattern(s)
skills lint: failed (1 error(s))
  13 feature(s)
harness lint: passed
  10 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 1 warning(s)
feature index: passed
log rollup: passed
  48 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check failed

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
  error: packs/diagrams/skills/mk-diagram: 1914 KB, budget 1900 KB (set maxSkillKb in pack.json to allow it)
  warn: features/MK-PACKS-001.yml: watched paths changed since the verified commit d2d0342 (src/core/skills-lint.mjs); run npm run verify -- MK-PACKS-001
```

## Result

Failed: `npm run check`.
