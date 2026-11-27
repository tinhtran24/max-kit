---
features:
  - MK-PACKS-001
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: 240c7e2
branch: feat/port-frontend
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
- Exit: 0, 63.7s

```text
... 577 earlier line(s) omitted
✔ new hand-written migration is denied with the repo generator (28.49025ms)
✔ risky commands ask, extended patterns apply, safe commands pass (13.32525ms)
✔ deny wins over ask in the same command (13.612625ms)
✔ disabled guards do not run (13.855584ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (135.704333ms)
✔ the hook command fails open on a bad payload (49.372ms)
✔ a fresh knowledgebase passes the full check (74.829792ms)
✔ init fills project values but keeps template placeholders (18.225125ms)
✔ passing without evidence is an error (15.981875ms)
✔ blocked needs a blocker, ids must match the prefix (14.255833ms)
✔ new feature and run, then evidence makes passing valid (28.644041ms)
✔ stale generated index and log are detected and fixed (15.834833ms)
✔ broken links and edited generated files fail the check (19.882208ms)
✔ boot budget and duplicated rules fail the check (24.675ms)
✔ test/helpers.mjs (49.630375ms)
✔ journal create redacts, records context, and lists newest first (745.478291ms)
✔ journal refuses empty bodies and validate flags bad entries (470.609208ms)
✔ handoff reports repo, plan and harness state (625.052958ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (349.373875ms)
✔ pr-body check requires the contract sections; --loose skips traceability (149.65625ms)
✔ transform renames, maps exact commands and reports the rest (1.773417ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (57.573375ms)
✔ skills lint checks names, references, commands and forbidden names (14.305208ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (68.368417ms)
✔ rename-skill moves the folder and rewrites references, slash commands and paths (5.1215ms)
✔ create scaffolds plan and phases, makes it current, and validates (366.849917ms)
✔ check moves phase status and progress; the table regenerates (612.57275ms)
✔ update completed warns about open items; close hides the plan from resolve (590.4405ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (796.455084ms)
✔ validate catches broken phase files (184.228041ms)
✔ completing a plan warns when its harness feature is not passing (238.736417ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (324.133208ms)
✔ set reads stdin, never prints the value, and stores it encrypted (68.211166ms)
✔ literal values, duplicates and short values are refused (202.998583ms)
✔ get, search, list, annotate and rotate work on metadata only (338.037667ms)
✔ compare answers match or differs without printing values (174.959ms)
✔ import-env plans without values, skips examples and existing refs (164.402042ms)
✔ run injects values for the user and redacts them in output (204.083833ms)
✔ an agent needs a user grant; once grants are used up (581.935167ms)
✔ reveal and delete are guarded; the audit log never holds values (283.237542ms)
✔ the secret-store choice is recorded per project or per user (293.551833ms)
✔ the secrets guard blocks agents from reading secret files (16.139375ms)
✔ passing verification records evidence and marks the feature passing (238.368542ms)
✔ a second verify on the same day gets its own run file (255.486791ms)
✔ failing verification records a failed run and demotes passing (173.429ms)
✔ open unknowns or a dirty repo keep the feature from passing (272.230292ms)
✔ risky commands need --allow-risky; manual features cannot be verified (204.623292ms)
✔ watched paths changing after the verified commit make evidence stale (303.972958ms)
✔ the newest same-day run decides freshness, not file-name order (298.393791ms)
✔ evidence naming a commit that does not exist is reported (175.811875ms)
✔ acceptance criteria must be covered and covers must exist (102.22525ms)
✔ redaction covers common secret shapes (0.18625ms)
ℹ tests 259
ℹ suites 11
ℹ pass 259
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 63604.21875
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 0, 0.9s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  73 skill(s) in core and 13 pack(s), 17 forbidden pattern(s)
skills lint: passed with 21 warning(s)
  14 feature(s)
harness lint: passed
  12 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 2 warning(s)
feature index: passed
log rollup: passed
  52 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed

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
  warn: mk-mcp-builder is planned but not ported yet; referenced by mk-webmcp, mk-bootstrap
  warn: mk-agentize is planned but not ported yet; referenced by mk-webmcp, mk-bootstrap, mk-brainstorm
  warn: mk-mobile-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-backend-development is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-deploy is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-devops is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-better-auth is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-databases is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-payment-integration is planned but not ported yet; referenced by mk-bootstrap
  warn: mk-web-testing is planned but not ported yet; referenced by mk-bootstrap, mk-test
  warn: mk-project-management is planned but not ported yet; referenced by mk-fix
  warn: features/MK-PORT-002.yml: watched paths changed since the verified commit d2d0342 (packs/workflow/skills/mk-bootstrap/SKILL.md, packs/workflow/skills/mk-bootstrap/references/shared-phases.md, packs/workflow/skills/mk-cook/references/workflow-routing.md and 1 more); run npm run verify -- MK-PORT-002
  warn: features/MK-PORT-005.yml: watched paths changed since the verified commit b3cec90 (packs/diagrams/skills/mk-preview/references/generation-modes.md, packs/diagrams/skills/mk-preview/references/html-design-guidelines.md, packs/diagrams/skills/mk-preview/references/html-mode-workflow.md and 2 more); run npm run verify -- MK-PORT-005
```

## Result

All commands exited 0.
