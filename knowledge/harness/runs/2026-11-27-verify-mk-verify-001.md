---
features:
  - MK-VERIFY-001
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: ded8be2
branch: feat/verify-evidence
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
- Exit: 0, 1.5s

```text
... 17 earlier line(s) omitted
✔ patch file paths are parsed with their operation (17.720583ms)
✔ codex adapter satisfies the contract and is built in (1.156125ms)
✔ codex render matches golden files (0.903542ms)
✔ session start returns additionalContext (53.556542ms)
✔ protected push is denied in the codex format (20.466667ms)
✔ ask becomes deny by default because codex cannot ask (15.770958ms)
✔ askFallback warn turns ask into context and lets the call run (12.833709ms)
✔ apply_patch adding a migration is denied, updating one is allowed (97.659917ms)
✔ apply_patch on a deploy branch is denied (72.523ms)
✔ stop blocks once in the codex format (74.300625ms)
✔ a knowledgebase targeting claude and codex renders both and passes the check (9.841625ms)
✔ detection per stack matches the golden file (12.051875ms)
✔ every profile loads and inherits the generic guards (1.144625ms)
✔ detect --write adds repos and fills only empty fields (202.130167ms)
✔ init --detect on a folder with one stack sets the project profile (75.681708ms)
✔ migration guard blocks a hand-written file for rails-rspec (77.065917ms)
✔ migration guard blocks a hand-written file for laravel (70.519375ms)
✔ migration guard blocks a hand-written file for django (66.163709ms)
✔ migration guard blocks a hand-written file for go-goose (78.678333ms)
✔ migration guard blocks a hand-written file for node-prisma-pnpm (61.125ms)
✔ migration guard blocks a hand-written file for php-dbmate (84.095459ms)
✔ the migration message names the container (66.611167ms)
✔ profile risky commands apply to repos of that stack (65.066708ms)
✔ session start injects read order and team rules (59.722209ms)
✔ hooks stay silent outside a knowledgebase (0.450583ms)
✔ push to a protected branch is denied, task branch allowed (29.614333ms)
✔ push with no refspec uses the repo's current branch (175.546667ms)
✔ edits on a deploy branch are denied (134.976583ms)
✔ new hand-written migration is denied with the repo generator (23.568416ms)
✔ risky commands ask, extended patterns apply, safe commands pass (8.66275ms)
✔ deny wins over ask in the same command (7.826ms)
✔ disabled guards do not run (8.445ms)
✔ stop asks for evidence when a repo is dirty and no recent run exists (80.993334ms)
✔ the hook command fails open on a bad payload (35.901125ms)
✔ a fresh knowledgebase passes the full check (56.375542ms)
✔ init fills project values but keeps template placeholders (19.519416ms)
✔ passing without evidence is an error (15.344167ms)
✔ blocked needs a blocker, ids must match the prefix (13.196958ms)
✔ new feature and run, then evidence makes passing valid (26.291375ms)
✔ stale generated index and log are detected and fixed (17.719458ms)
✔ broken links and edited generated files fail the check (17.569125ms)
✔ boot budget and duplicated rules fail the check (20.308375ms)
✔ test/helpers.mjs (66.591792ms)
✔ passing verification records evidence and marks the feature passing (195.424208ms)
✔ a second verify on the same day gets its own run file (193.111334ms)
✔ failing verification records a failed run and demotes passing (112.198625ms)
✔ open unknowns or a dirty repo keep the feature from passing (186.187333ms)
✔ risky commands need --allow-risky; manual features cannot be verified (114.881458ms)
✔ watched paths changing after the verified commit make evidence stale (212.757583ms)
✔ evidence naming a commit that does not exist is reported (109.877959ms)
✔ acceptance criteria must be covered and covers must exist (53.012125ms)
✔ redaction covers common secret shapes (0.145084ms)
ℹ tests 65
ℹ suites 0
ℹ pass 65
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1367.440584
```

### 2. `npm run check`

- Repo: knowledgebase
- Exit: 0, 0.2s

```text

> max-kit@0.1.0 check
> node bin/max-kit.mjs check

  6 feature(s)
harness lint: passed
  3 passing feature(s) with a resolvable evidence commit
evidence freshness: passed
feature index: passed
log rollup: passed
  29 markdown file(s)
links: passed
  boot context 3236/9000 chars
boot budget: passed
generated files: passed

check passed
```

## Result

All commands exited 0.
