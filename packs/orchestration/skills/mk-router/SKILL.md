---
name: mk-router
description: "Route a request to the right max-kit skill or chain of skills (plan, build, debug, test, review, ship, docs, design, ops) from the packs enabled in this project; use when the right skill is unclear or the work spans several."
when_to_use: "Invoke when a request is broad, spans several stages, or no single skill obviously owns it; a request that clearly names one skill goes straight to that skill."
category: meta
keywords: [routing, workflow, chain, skills, orchestration]
argument-hint: "[request]"
metadata:
  author: max-kit
  version: "1.0.0"
---

# Router

Pick the smallest set of skills that gets the request done with proof, then hand off. Routing is a decision, not a ritual: a request one skill clearly owns goes straight to it.

## 1. Read what is installed

- Skills: the runtime's skill catalog; in a knowledgebase, `mk skills list` and `max-kit.config.json` › `packs`.
- Harness: `knowledge/harness/features-index.md`. A task with a matching feature carries its acceptance criteria and verification; a new task with a real trigger gets one (`mk new feature`).
- Current plan: `mk plan resolve`. When one is active, continue it rather than starting over.

## 2. Classify the request

| Request shape | Route |
|---|---|
| Unclear outcome, several viable approaches | `mk-brainstorm` (or `mk-advise` to agree the outcome first), then plan |
| Feature or change with more than one step | `mk-plan` (writes the plan and links the harness feature), then `mk-cook` |
| Something fails or behaves wrongly | `mk-debug` (root cause first), then `mk-fix` |
| Tests to write, run or speed up | `mk-test` (`mk-web-testing` for browser and load tests) |
| Review a diff or a pull request | `mk-code-review`, `mk-review-pr` |
| Land finished work | `mk-ship` (gates on `mk check` and `mk verify`) |
| Question about code or a concept | `mk-ask`, `mk-explain`, `mk-scout` for "where is" |
| Continue another session, report status | `mk-handoff`, `mk-watzup`, `mk-journal` |
| Docs, diagrams, design, media, ops, security | the owning skill in the `docs`, `diagrams`, `frontend`, `media`, `ops` packs |
| Parallel independent work | `mk-team` |
| Improve a skill itself | `mk-skill-creator`; after a rough session, `mk-dogfood` |

When the right skill lives in a pack that is not enabled, say which pack and the config line that enables it instead of improvising its work.

## 3. Chain with gates

Typical chains, each step's output feeding the next:

- **Build**: plan → cook → test → code-review → ship.
- **Fix**: debug → fix → test → code-review.
- **Unknown territory**: scout or research → brainstorm → plan.

Gates between steps:

- Do not start building before the plan's acceptance criteria exist.
- Do not report a task done before `mk verify <ID>` passed for its feature, or the blocker is recorded on the feature.
- Stop after two failed fix rounds and bring the options to the user (team rules).

## 4. Hand off

State the chosen route in one line (skill, why, what proves done), then invoke the first skill. Re-route only when a step's result changes the shape of the work.
