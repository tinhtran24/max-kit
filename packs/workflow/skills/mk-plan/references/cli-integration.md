# CLI Integration & Plan Scaffolding

`mk plan` scaffolds plan files and changes their state. It has no database: the files are the plan, and every command reads and writes them directly.

## Files-first

- `plan.md` plus `phase-NN-*.md` under `plans/<stamp>-<slug>/` at the workspace root (the git top level; `MK_PLANS_DIR` overrides it) are the plan.
- `plan.md` front matter carries `title`, `status` (pending, in-progress, completed, cancelled), `state` (active, closed, archived), `created`, `branch`, and optionally `feature` (the harness feature this plan delivers), `linked_pr` and `issue`.
- A GitHub issue is an optional visibility projection; plans work fully as local files.

## Scaffolding rules

- Run `mk plan help` for live syntax; do not copy a command schema into the plan.
- Create with `mk plan create --title "<title>" --phase "<name>" ... [--feature <ID>]`. It writes `plan.md`, one `phase-NN-<name>.md` per phase and makes the plan current for this worktree. Add phases later with `mk plan add-phase <plan> "<name>"`.
- The Phases table in `plan.md` sits between `mk:phases` markers and is regenerated from the phase files by every `mk plan` command. Do not hand-edit inside the markers; edit the phase files.
- Phase status follows its checkboxes: all checked is `completed`, some checked is `in-progress`. Tick with `mk plan check <phase-file> [--item N]`.
- Link the plan to its harness feature (`--feature`). The plan says how; the feature's verification proves it is done.
- In `--html` mode, write `plan.html` after the planning gates finish so it reflects the reviewed plan; `plan.md` stays the concise index.

## Mandatory generated-file read pass

After scaffolding and before composing content, read `plan.md` and every generated `phase-*.md` stub, including future phases. Write or edit the full content only after that read pass, then run `mk plan validate`.

## Canonical phase file

```markdown
---
phase: <N>
title: "<Phase Name>"
status: pending       # pending | in-progress | completed (follows the checkboxes)
priority: P2          # P1 | P2 | P3
effort: ""            # e.g. "4h", "2d"
dependencies: []      # phase numbers this blocks on
---

# Phase <N>: <Name>

## Goal
[One clear sentence defining what this phase accomplishes]

## Files to create or modify
- Create: `path/to/file.ts`
- Modify: `path/to/existing.ts`

## Tasks
- [ ] [Concrete actionable step]
- [ ] [Concrete actionable step]

## Verification
- [Command to verify, and its expected result]
```

`mk plan validate` checks: whole-number phase files without gaps, front matter matching the file number, a title, at least one checklist item and a Verification section per phase, known dependencies, and no `completed` plan with open items.
