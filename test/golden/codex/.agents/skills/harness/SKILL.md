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

Automated features (`verification.commands`):

```sh
npm run verify -- <ID>            # add --dry-run first to see the commands
```

It runs each command in its repo, writes `harness/runs/<date>-verify-<id>.md` with the commit, branch and redacted output, and on success adds the evidence and sets `passing` (unless unknowns are open or the repo is dirty). Commands that match a risky pattern need the user's yes, then `--allow-risky`.

Manual features (`verification.protocol`):

1. Follow the protocol.
2. `npm run new:run -- <ID>[,<ID>] <slug> [--repo <id>]`; fill `result`, `tier` (high | low, with the reason) and the observed output. Use `pr:` instead of `commit` when verifying a pull request.
3. Fake data only; no customer data.

High-risk features: before marking `passing`, ask the `verifier` agent (fresh context) to check the feature against its evidence.

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
