---
name: mk-fix
description: "Fix bugs, test failures, type and lint errors, log errors, UI defects and CI/CD failures with intelligent routing."
when_to_use: "Invoke when there is a concrete bug, error, or CI failure."
category: workflow
keywords: [bugfix, error, test-failure, CI, lint]
argument-hint: "[issue] --auto|--review|--quick|--parallel [--ultra] [--advice] [--skip-journal]"
metadata:
  author: max-kit
  version: "2.6.3"
  workflow:
    precedes: [mk-test]
---

# Fixing

Python scripts in this skill run as `python <script>`; on macOS/Linux without `python`, use `python3`. On Windows never use `python3` (it opens the Microsoft Store stub).

Repair a concrete symptom, prove its cause before editing, and verify the repaired behavior.
Reuse the opening outcome, constraints, non-goals and acceptance criteria. Record the failing
command or observed behavior before editing; it is the before/after evidence.

## Modes

- `--auto`: default; continue within authorized scope through repair and verification.
- `--review`: explicit human review at each major step.
- `--quick`: a bounded cause-aligned repair using `references/workflow-quick.md`.
- `--parallel`: independent issues with disjoint ownership and available delegation.
- `--advice`: supervisor checkpoints described below.
- `--ultra`: post-diagnosis best-of-5 selection; conflicts with quick and parallel.

## Advisory supervision (`--advice`)

When `--advice` is present, run this skill under `kongming` supervision, as
defined by `../mk-brainstorm/references/advisory-supervision.md`. Load
`references/advisory-supervision-checkpoints.md` for the spawn checkpoints, when
`--advice` counts as active, and how supervision persists through a PR.

## Diagnose, repair and finish

Choose quick for a clear local cause, standard for multi-file work, and deep for architecture
or competing fixes (`references/complexity-assessment.md`). Read only that route.
`references/diagnosis-gates.md` owns required cause and verification evidence. Use a
discriminating test for uncertainty; reasoning helpers are optional, never an automatic chain.

Add a regression test when it detects meaningful behavior; type/lint fixes can use their
existing checker. Reuse checks for unchanged source, inputs and environment. Independent
review scales with risk and repository requirements, not every trivial fix.

Repair your regressions within the authorized scope. Ask only for a material missing decision,
a contract reversal or an unauthorized destructive action. After three failed repair attempts,
stop and reconsider the architecture with the user and evidence. With `--advice`, obtain
counsel on every failed verification before re-diagnosis or edits, including in quick mode.

Finalize by reconciling an existing plan if present, updating impacted docs and reporting
cause, changed paths, verification and limitations. Use available tracking; no missing
Engineer-only skill blocks a local fix. Commit or publish only when already authorized.

### Journal step — opt-out

Skip the automatic `/mk-journal` step when either applies:
- The invocation includes the `--skip-journal` flag, OR
- `mk prefs resolve --json | jq -r 'if [.prefs?.journal?.auto?] == [false] then "false" else "true" end'` returns `false`. If the command errors or prints anything other than the exact string `false`, treat as `true` (default) — corrupt or missing config never suppresses the automatic journal.

Precedence: flag > project config > user config > default (`true`).
When skipped, print one line:
- `journal skipped by --skip-journal` (flag), or
- `journal skipped by preference` (config).

Explicit `/mk-journal` and `mk log` are unaffected. The opt-out covers the journal step only; the rest of the Finalize block still runs.

## Ultra Verifier Mode (`--ultra`)

`--ultra` is the best-of-5 wave defined by
`../mk-brainstorm/references/ultra-verifier-mode.md`. It fans only the
post-diagnosis solution selection to five independent read-only fix-plan
candidates, which never re-derive the confirmed root cause; one verifier then
selects the single winning fix plan. It hard-conflicts with `--quick` and
`--parallel`. `references/ultra-verifier-mode-fix.md` has the candidate task,
rubric, finalizer and conflict handling.

## References

Load as needed:
- `references/mode-selection.md` - asking for a mode when no flag was given
- `references/complexity-assessment.md` - quick, standard, deep or parallel route
- `references/workflow-quick.md`, `references/workflow-standard.md`, `references/workflow-deep.md` - the routes
- `references/review-cycle.md` - review loop for `--auto` and `--review`
- `references/skill-activation-matrix.md` - optional helper skills by need
- `references/parallel-exploration.md` - delegation rules and `--parallel` issue trees
- `references/advisory-supervision-checkpoints.md` - `--advice` spawn checkpoints
- `references/diagnosis-gates.md` - exact-root-cause and no-side-effects gates
- `references/ultra-verifier-mode-fix.md` - `--ultra` fix-plan selection

Specialized workflows: `references/workflow-ci.md` (CI failures), `references/workflow-logs.md`
(application logs), `references/workflow-test.md` (test suites), `references/workflow-types.md`
(type errors), `references/workflow-ui.md` (visual/UI issues).
