---
name: harness
description: Use when starting, verifying or closing a non-trivial task in a workspace that has max-kit.config.json - picks or creates the harness feature, records run evidence, moves feature state, logs the work and runs the quality gate. Also for "is this done", "record evidence", "mark passing", "new feature", "log this".
---

# Harness workflow

The harness answers one question: what proves this task is done? No evidence means not done.

Run every command from the knowledgebase root (the folder with `max-kit.config.json`).

## 1. Pick the feature

1. Read `knowledge/harness/features-index.md`. Match by area and title.
2. Open only `knowledge/harness/features/<ID>.yml`.
3. No match and a real trigger exists (user request, ticket, incident, source review, tooling decision, migration):
   `npm run new:feature -- <ID> "<title>" <area> [trigger-type]`, then fill `trigger`, `behavior`, `scope`, `verification`.
   Never create a feature only to make the state counts look healthy.

## 2. Work

- Set `state: active` and today's `updated_at`.
- Follow `knowledge/synthesis/team-rules.md` (order of work, verification tier, two-round limit).

## 3. Verify and record

1. Run the feature's `verification.commands` or follow its `protocol`.
2. `npm run new:run -- <ID>[,<ID>] <slug> [--repo <id>]`; fill the front matter:
   - `result`: passed | failed | blocked | skipped
   - `tier`: high | low (with the reason)
   - `commit` is filled from the repo; use `pr:` instead when verifying a pull request
3. Paste commands and the output summary into the run body. Fake data only; no customer data.

## 4. Move state

| Outcome | Feature change |
| --- | --- |
| Verification passed | `state: passing`, `last_verified_at: <today>`, add `harness/runs/<file>` to `evidence`, empty `unknowns` |
| Cannot verify | `state: blocked`, `blocker:` the missing env, source, credential, seed data or decision |
| Still in progress | stays `active` |
| No longer relevant | `state: retired` |

## 5. Close

```sh
npm run log -- <kind> "<title>" "Feature: <ID>" "Evidence: harness/runs/<file>"
npm run index
npm run rollup
npm run check
```

Report: feature id, verification result (passed, failed or skipped), command, evidence path, remaining blocker.
