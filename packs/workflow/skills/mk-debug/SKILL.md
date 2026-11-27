---
name: mk-debug
description: "Debug failing or misbehaving code by proving the root cause before any fix; diagnose why something fails, gives wrong output or is flaky in CI."
when_to_use: "Invoke before editing code for any error, stack trace or failing test; writing new tests is mk-test."
category: workflow
keywords: [debug, root-cause, bugs, test-failures]
languages: all
argument-hint: "[error or issue description] [--ultra]"
metadata:
  author: max-kit
  version: "4.2.2"
---

# Debugging & System Investigation

## Iron laws

**No fixes without root cause investigation first.** Find the root cause, fix at the source,
validate the failure path and affected boundaries.

**No completion claims without fresh verification evidence.** Run the command, read the
output, then claim the result. For a completed repair, relevant evidence is enough; the full
diagnostic workflow is for unresolved failures.

## Routing

Load a reference only when the task needs its detail.

| Situation | Load |
|---|---|
| Bug needing investigation and fix (four phases) | `references/systematic-debugging.md` |
| Bad value deep in a call stack; test pollution (`scripts/find-polluter.sh`) | `references/root-cause-tracing.md` |
| Choosing validation layers once the cause is known | `references/defense-in-depth.md` |
| About to claim fixed, passing or done | `references/verification.md` |
| Server incident, system behavior, multi-component failure | `references/investigation-methodology.md` |
| CI/CD pipeline, server or deployment log failures | `references/log-and-ci-analysis.md` |
| Slow queries, latency, resource exhaustion | `references/performance-diagnostics.md` |
| Reporting any measured speedup, regression, latency or resource number | `../mk-test/references/explain-the-number.md` |
| Writing a diagnostic report | `references/reporting-standards.md` |
| 3+ step investigation, parallel evidence collection, debugger subagents | `references/task-management-debugging.md` |
| Frontend files touched (tsx/jsx/vue/svelte/html/css), UI bugs, visual regressions | `references/frontend-verification.md` |

## Tools and handoffs

- **Codebase:** `/mk-scout` or `/mk-scout ext` to find files; `mk-docs-seeker` for package
  docs; `mk-repomix` for a codebase summary.
- **Frontend:** `mk-agent-browser`, `mk-chrome-profile`, Chrome MCP / `chrome-devtools-mcp`,
  or project-native browser tests. When real Chrome profile state matters, let
  `chrome-profile open --json` create the tab and bind to its returned selector before using
  MCP inspection tools; raw Chrome MCP navigation is only for profile-independent inspection.
- **Stuck:** `mk-problem-solving` for complex issues.
- **Position:** usually follows `/mk-scout`; hands off to `/mk-fix` to repair the diagnosed
  issue, or `/mk-brainstorm` when several fixes are viable.

## Ultra Verifier Mode (`--ultra`)

When `--ultra` is present, run the diagnosis as a best-of-5 verifier pass. The
controller gathers the evidence once — symptom, reproduction, logs, stack
traces, scouted code paths — into one immutable evidence packet plus a rubric,
dispatches exactly five independent read-only candidate diagnoses in one
parallel wave, then a single strongest-model verifier scores them.

- **Candidate task:** each candidate produces a complete diagnosis — root-cause
  hypothesis with file:line evidence, elimination of rival hypotheses, blast
  radius, and a verification plan — from the same packet. Candidates only
  analyze. Never fan mutating steps: no candidate runs fixes, edits files, or
  mutates system state.
- **Rubric:** evidence chain strength, rival-hypothesis elimination, specificity
  of the root cause (line/condition, not vibes), and testability of the
  verification plan.
- **Finalizer:** the verifier selects the single winning diagnosis unchanged (or
  rejects all); the controller then verifies the winning root cause with fresh
  evidence (iron law) before any fix. On reject-all, hard-stop and report why.

Full mechanics (evidence packet, anonymization, the five-usable-candidate gate,
reject-all, and the fail-closed runtime rule) are in
`../mk-brainstorm/references/ultra-verifier-mode.md`.
