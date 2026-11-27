---
features:
  - MK-PACKS-001
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: d4288fd
branch: feat/skills-port
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
- Exit: 0, 1.5s

```text
... 21 earlier line(s) omitted
✔ protected push is denied in the codex format (14.624625ms)
✔ ask becomes deny by default because codex cannot ask (15.001833ms)
✔ askFallback warn turns ask into context and lets the call run (17.494167ms)
✔ apply_patch adding a migration is denied, updating one is allowed (113.521958ms)
✔ apply_patch on a deploy branch is denied (67.9035ms)
✔ stop blocks once in the codex format (89.161291ms)
✔ a knowledgebase targeting claude and codex renders both and passes the check (12.909458ms)
✔ detection per stack matches the golden file (11.231458ms)
✔ every profile loads and inherits the generic guards (1.135666ms)
✔ detect --write adds repos and fills only empty fields (203.628709ms)
✔ init --detect on a folder with one stack sets the project profile (62.884291ms)
✔ migration guard blocks a hand-written file for rails-rspec (105.923167ms)
✔ migration guard blocks a hand-written file for laravel (70.126959ms)
✔ migration guard blocks a hand-written file for django (65.068625ms)
✔ migration guard blocks a hand-written file for go-goose (67.2855ms)
✔ migration guard blocks a hand-written file for node-prisma-pnpm (67.020917ms)
✔ migration guard blocks a hand-written file for php-dbmate (64.749292ms)
✔ the migration message names the container (64.566292ms)
✔ profile risky commands apply to repos of that stack (60.021917ms)
✔ session start injects read order and team rules (43.690292ms)
✔ hooks stay silent outside a knowledgebase (2.867792ms)
✔ push to a protected branch is denied, task branch allowed (28.618625ms)
✔ push with no refspec uses the repo's current branch (187.1185ms)
✔ edits on a deploy branch are denied (153.395292ms)
✔ new hand-written migration is denied with the repo generator (19.795166ms)
✔ risky commands ask, extended patterns apply, safe commands pass (9.172875ms)
✔ deny wins over ask in the same command (8.543583ms)
✔ disabled guards do not run (7.804458ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (79.049041ms)
✔ the hook command fails open on a bad payload (36.863542ms)
✔ a fresh knowledgebase passes the full check (53.365834ms)
✔ init fills project values but keeps template placeholders (23.715917ms)
✔ passing without evidence is an error (14.719125ms)
✔ blocked needs a blocker, ids must match the prefix (12.590833ms)
✔ new feature and run, then evidence makes passing valid (30.402459ms)
✔ stale generated index and log are detected and fixed (16.442584ms)
✔ broken links and edited generated files fail the check (20.157875ms)
✔ boot budget and duplicated rules fail the check (19.711875ms)
✔ test/helpers.mjs (54.545416ms)
✔ transform renames, maps exact commands and reports the rest (1.409083ms)
✔ port --write copies into packs, drops owner notices and keeps third-party ones (63.280458ms)
✔ skills lint checks names, references, commands and forbidden names (15.541292ms)
✔ enabled packs render for claude and codex, with requires, and are pruned when disabled (49.683667ms)
✔ passing verification records evidence and marks the feature passing (185.55025ms)
✔ a second verify on the same day gets its own run file (199.576875ms)
✔ failing verification records a failed run and demotes passing (110.885792ms)
✔ open unknowns or a dirty repo keep the feature from passing (166.560084ms)
✔ risky commands need --allow-risky; manual features cannot be verified (113.131417ms)
✔ watched paths changing after the verified commit make evidence stale (207.411125ms)
✔ evidence naming a commit that does not exist is reported (113.374542ms)
✔ acceptance criteria must be covered and covers must exist (51.631291ms)
✔ redaction covers common secret shapes (0.144625ms)
ℹ tests 69
ℹ suites 0
ℹ pass 69
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1364.695667
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 0, 0.2s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  1 skill(s) in core and 13 pack(s)
skills lint: passed
  7 feature(s)
harness lint: passed
  4 passing feature(s) with a resolvable evidence commit
evidence freshness: passed
feature index: passed
log rollup: passed
  30 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed
```

## Result

All commands exited 0.
