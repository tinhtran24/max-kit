---
name: mk-plans-kanban
description: "Show plans as a kanban board (pending, in progress, completed, cancelled) from the plan files, in Markdown or as an HTML page."
when_to_use: "Invoke for a plan kanban, progress overview across plans, or a quick way into plan files."
category: meta
keywords: [plans, dashboard, kanban, progress]
argument-hint: "[--html <file>] [--all]"
metadata:
  author: max-kit
  version: "3.0.0"
---

# Plans kanban

Build the board from the plan files; there is no server to start.

```bash
mk plan list --all --json | node scripts/board.mjs                    # Markdown board in the reply
mk plan list --all --json | node scripts/board.mjs --html plans/board.html
```

Drop `--all` to show only active plans (closed and archived ones are hidden). Each card shows the title, checklist progress and the harness feature the plan delivers; open a plan with `mk plan show <name>`.

The board is a view: change progress in the phase files (`mk plan check`) and status with `mk plan update`, never by editing the board.
