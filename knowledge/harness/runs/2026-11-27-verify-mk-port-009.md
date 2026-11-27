---
features:
  - MK-PORT-009
date: 2026-11-27
result: passed
tier: low
repo: knowledgebase
commit: 5b2dd51
branch: feat/port-orchestration
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
---

# Run 2026-11-27: verify MK-PORT-009

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All tests pass; check passed with forbidden patterns active.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Exit: 0, 63.8s

```text
... 650 earlier line(s) omitted
✔ stop asks for evidence when a repo is dirty and no recent run exists (127.193583ms)
✔ the hook command fails open on a bad payload (59.795333ms)
✔ a fresh knowledgebase passes the full check (37.771625ms)
✔ init fills project values but keeps template placeholders (19.79725ms)
✔ passing without evidence is an error (13.014208ms)
✔ blocked needs a blocker, ids must match the prefix (10.488916ms)
✔ new feature and run, then evidence makes passing valid (24.163791ms)
✔ stale generated index and log are detected and fixed (13.689084ms)
✔ broken links and edited generated files fail the check (15.423208ms)
✔ boot budget and duplicated rules fail the check (23.225792ms)
✔ test/helpers.mjs (43.922083ms)
✔ transcripts are summarised as names and counts only (2.982583ms)
✔ one record per session; repeated errors nudge once with evidence ids (118.79925ms)
✔ guard hits are recorded and suggest a team rule after five (138.929667ms)
✔ recording can be turned off, and clear needs --yes (124.808875ms)
✔ journal create redacts, records context, and lists newest first (749.476125ms)
✔ journal refuses empty bodies and validate flags bad entries (387.356416ms)
✔ handoff reports repo, plan and harness state (594.739375ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (355.852959ms)
✔ pr-body check requires the contract sections; --loose skips traceability (146.677459ms)
✔ transform renames, maps exact commands and reports the rest (4.829125ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (52.393ms)
✔ skills lint checks names, references, commands and forbidden names (14.09875ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (92.489ms)
✔ rename-skill moves the folder and rewrites references, slash commands and paths (5.272833ms)
✔ create scaffolds plan and phases, makes it current, and validates (305.935083ms)
✔ check moves phase status and progress; the table regenerates (543.247ms)
✔ update completed warns about open items; close hides the plan from resolve (584.115ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (761.58775ms)
✔ validate catches broken phase files (182.577083ms)
✔ completing a plan warns when its harness feature is not passing (231.973042ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (312.055791ms)
✔ set reads stdin, never prints the value, and stores it encrypted (58.062042ms)
✔ literal values, duplicates and short values are refused (152.847417ms)
✔ get, search, list, annotate and rotate work on metadata only (295.335625ms)
✔ compare answers match or differs without printing values (164.019708ms)
✔ import-env plans without values, skips examples and existing refs (164.191208ms)
✔ run injects values for the user and redacts them in output (174.592708ms)
✔ an agent needs a user grant; once grants are used up (588.078084ms)
✔ reveal and delete are guarded; the audit log never holds values (259.803083ms)
✔ the secret-store choice is recorded per project or per user (283.351958ms)
✔ the secrets guard blocks agents from reading secret files (15.649584ms)
✔ passing verification records evidence and marks the feature passing (220.040584ms)
✔ a second verify on the same day gets its own run file (262.39925ms)
✔ failing verification records a failed run and demotes passing (157.273833ms)
✔ open unknowns or a dirty repo keep the feature from passing (247.510917ms)
✔ risky commands need --allow-risky; manual features cannot be verified (153.657708ms)
✔ watched paths changing after the verified commit make evidence stale (278.297208ms)
✔ the newest same-day run decides freshness, not file-name order (294.904583ms)
✔ evidence naming a commit that does not exist is reported (142.240583ms)
✔ acceptance criteria must be covered and covers must exist (81.781084ms)
✔ redaction covers common secret shapes (0.186291ms)
ℹ tests 271
ℹ suites 11
ℹ pass 271
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 63570.031709
```

### 2. `npm run check`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 1.3s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  105 skill(s) in core and 13 pack(s), 28 forbidden pattern(s)
skills lint: passed with 1 warning(s)
  18 feature(s)
harness lint: passed
  15 passing feature(s) with a resolvable evidence commit
evidence freshness: passed with 6 warning(s)
feature index: passed
log rollup: passed
  65 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed

  warn: mk-orchestrate is planned but not ported yet; referenced by mk-codex-goal, mk-handoff, mk-vibe, mk-team, mk-atoz, mk-scout
  warn: features/MK-PACKS-001.yml: watched paths changed since the verified commit 31d916a (scripts/port-skills.mjs); run npm run verify -- MK-PACKS-001
  warn: features/MK-PORT-003.yml: watched paths changed since the verified commit 08e3c2f (packs/continuity/pack.json, packs/continuity/skills/mk-dogfood/SKILL.md, packs/continuity/skills/mk-dogfood/evals/README.md and 16 more); run npm run verify -- MK-PORT-003
  warn: features/MK-PORT-004.yml: watched paths changed since the verified commit 31d916a (packs/delivery/skills/mk-ship/references/ship-workflow.md, packs/delivery/skills/mk-vibe/SKILL.md, packs/delivery/skills/mk-worktree/scripts/resolve-worktree-root.cjs and 1 more); run npm run verify -- MK-PORT-004
  warn: features/MK-PORT-005.yml: watched paths changed since the verified commit 31d916a (packs/diagrams/skills/mk-diagram/references/mermaid-input.md, packs/diagrams/skills/mk-diagram/scripts/render-mermaid.test.mjs, packs/docs/skills/mk-docs/references/operational-lookup.md); run npm run verify -- MK-PORT-005
  warn: features/MK-PORT-006.yml: watched paths changed since the verified commit 31d916a (packs/frontend/skills/mk-page-builder/SKILL.md); run npm run verify -- MK-PORT-006
  warn: features/MK-PORT-008.yml: watched paths changed since the verified commit 77d189c (packs/quality/skills/mk-web-testing/skill.yaml, scripts/port-skills.mjs); run npm run verify -- MK-PORT-008
```

## Result

All commands exited 0.
