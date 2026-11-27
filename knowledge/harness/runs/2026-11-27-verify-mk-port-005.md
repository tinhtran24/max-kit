---
features:
  - MK-PORT-005
date: 2026-11-27
result: failed
tier: low
repo: knowledgebase
commit: 39b82f0
branch: feat/port-docs-diagrams
dirty: false
recorded_by: max-kit verify
covers:
  - AC1
  - AC2
---

# Run 2026-11-27: verify MK-PORT-005

Recorded by `max-kit verify`. Output is the last 60 lines of each command, with secrets redacted.

## Expected

All suites pass; check passed with forbidden patterns active.

## Commands

### 1. `npm test`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 16.3s

```text
... 561 earlier line(s) omitted
✔ edits on a deploy branch are denied (255.354625ms)
✔ new hand-written migration is denied with the repo generator (34.746375ms)
✔ risky commands ask, extended patterns apply, safe commands pass (12.672375ms)
✔ deny wins over ask in the same command (16.751583ms)
✔ disabled guards do not run (14.377833ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (198.449667ms)
✔ the hook command fails open on a bad payload (71.46825ms)
✔ a fresh knowledgebase passes the full check (64.83675ms)
✔ init fills project values but keeps template placeholders (16.801541ms)
✔ passing without evidence is an error (22.382666ms)
✔ blocked needs a blocker, ids must match the prefix (16.897833ms)
✔ new feature and run, then evidence makes passing valid (51.769083ms)
✔ stale generated index and log are detected and fixed (22.629417ms)
✔ broken links and edited generated files fail the check (21.742875ms)
✔ boot budget and duplicated rules fail the check (24.583ms)
✔ test/helpers.mjs (64.430125ms)
✔ journal create redacts, records context, and lists newest first (924.40325ms)
✔ journal refuses empty bodies and validate flags bad entries (455.049875ms)
✔ handoff reports repo, plan and harness state (724.889125ms)
✔ lang follows env, then prefs, then English; bad tags fall back with a reason (468.098083ms)
✔ pr-body check requires the contract sections; --loose skips traceability (187.987375ms)
✔ transform renames, maps exact commands and reports the rest (1.860584ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (56.050792ms)
✔ skills lint checks names, references, commands and forbidden names (13.912958ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (63.02275ms)
✔ create scaffolds plan and phases, makes it current, and validates (379.367958ms)
✔ check moves phase status and progress; the table regenerates (696.954125ms)
✔ update completed warns about open items; close hides the plan from resolve (667.320166ms)
✔ resolve picks the branch's plan, reports ambiguity, and honours use (895.949625ms)
✔ validate catches broken phase files (196.074ms)
✔ completing a plan warns when its harness feature is not passing (249.291917ms)
✔ prefs resolve merges user and project, with jq-compatible JSON (316.785ms)
✔ set reads stdin, never prints the value, and stores it encrypted (86.724583ms)
✔ literal values, duplicates and short values are refused (195.556917ms)
✔ get, search, list, annotate and rotate work on metadata only (352.939458ms)
✔ compare answers match or differs without printing values (186.313208ms)
✔ import-env plans without values, skips examples and existing refs (204.290416ms)
✔ run injects values for the user and redacts them in output (200.172334ms)
✔ an agent needs a user grant; once grants are used up (656.515333ms)
✔ reveal and delete are guarded; the audit log never holds values (322.582833ms)
✔ the secret-store choice is recorded per project or per user (313.670666ms)
✔ the secrets guard blocks agents from reading secret files (15.995125ms)
✔ passing verification records evidence and marks the feature passing (264.118791ms)
✔ a second verify on the same day gets its own run file (318.951958ms)
✔ failing verification records a failed run and demotes passing (218.8875ms)
✔ open unknowns or a dirty repo keep the feature from passing (279.230292ms)
✔ risky commands need --allow-risky; manual features cannot be verified (184.647083ms)
✔ watched paths changing after the verified commit make evidence stale (329.046542ms)
✔ the newest same-day run decides freshness, not file-name order (347.322959ms)
✔ evidence naming a commit that does not exist is reported (190.222666ms)
✔ acceptance criteria must be covered and covers must exist (80.0435ms)
✔ redaction covers common secret shapes (0.191375ms)
ℹ tests 243
ℹ suites 11
ℹ pass 243
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 16059.789333
```

### 2. `node packs/diagrams/skills/mk-diagram/scripts/test_compiler_matrix.mjs`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 0.1s

```text
=== Running 40-Combination Matrix Compilation Tests ===
✓ All 40 matrix combinations compiled successfully in SVG, Fragment, and HTML modes!

=== Running Byte Determinism Tests ===
✓ Determinism verified: byte-identical outputs across repeated compiles.

=== Running Strict Schema & Semantic Validation Tests ===
✓ Duplicate ID successfully rejected: Invalid IR: duplicate ID "node1" in component
✓ Dangling endpoint successfully rejected: Invalid IR: dangling connection "to" endpoint "nonexistent-node" at index 0

=== Running XSS Injection Safety Tests ===
✓ XSS injection payloads safely sanitized.
✓ Event-handler and javascript: URL payloads safely escaped.

=== Running Zero-Network / No-Browser Output Tests ===
✓ No external network references in any compiled HTML (offline-safe).

=== Running Multi-Fragment Isolation Tests ===
✓ Multiple fragments use distinct instance and marker IDs (no collision).

=== Running Semantic Rendering Tests (boundaries/lanes/stages/subtitle) ===
✓ Boundaries, lanes, stages, and subtitle render from authored IR.

========================================
ALL COMPILER MATRIX & SECURITY TESTS PASSED!
========================================
```

### 3. `node packs/diagrams/skills/mk-diagram/scripts/test_layout_geometry.mjs`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 0.0s

```text
✓ architecture-sample.json: 3 nodes, 2 edges, viewBox 714x246
✓ dataflow-sample.json: 3 nodes, 2 edges, viewBox 746x280
✓ lifecycle-sample.json: 5 nodes, 5 edges, viewBox 956x312
✓ sequence-sample.json: 4 nodes, 6 edges, viewBox 872x510
✓ workflow-pipeline.json: 11 nodes, 13 edges, viewBox 2001x690
✓ workflow-sample.json: 4 nodes, 3 edges, viewBox 978x534

ALL LAYOUT GEOMETRY TESTS PASSED (6 fixtures)
```

### 4. `node packs/diagrams/skills/mk-diagram/scripts/test_reader_interactions.mjs`

- Repo: knowledgebase
- Covers: AC1
- Exit: 0, 0.0s

```text
=== Reader Interaction Smoke Tests (DOM shim) ===
✓ Node focus highlights node and direct edges.
✓ Search focuses matching nodes by label/id/desc.
✓ Downstream reach traces authored directed edges.
✓ Route inspection highlights a deterministic authored path.
✓ Role lens highlights nodes by declared role.
✓ Escape clears all highlight/dim state.
✓ Chapter highlights the full focus_nodes array (≥2 nodes).
✓ Share card export serializes computed/fallback palette with reference-minus-definition completeness (classic + signal-flow).
✓ Re-init on same container is a no-op (init guard present).

========================================
ALL READER INTERACTION TESTS PASSED!
========================================
```

### 5. `npm run check`

- Repo: knowledgebase
- Covers: AC2
- Exit: 1, 0.6s

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
  47 markdown file(s)
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
