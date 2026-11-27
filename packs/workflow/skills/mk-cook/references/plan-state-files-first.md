# Plan State: Files-First Model

Shared by every skill that creates, resolves or changes a plan (`mk-plan`, `mk-issue-to-plan`, `mk-cook`, and any skill linking here). This is the single description of where plan state lives; link here instead of restating it.

## The files are the state

- `plans/<stamp>-<slug>/plan.md` plus `phase-NN-*.md` ARE the plan: hand-editable Markdown, and the only thing implementation skills read to know what to build.
- `mk plan` reads and writes those files directly. There is no index to rebuild and nothing to drift.
- `plan.md` front matter: `status` (pending, in-progress, completed, cancelled) says how far the work is; `state` (active, closed, archived) says whether the plan is still in play; `feature` names the harness feature that proves the outcome.
- Phase files carry their own `status`, which follows their checkboxes. Change progress with `mk plan check <phase-file> [--item N]` / `uncheck`, not by editing the generated Phases table.

## Current-plan resolution

- `mk plan use <plan>` sets the current plan for this worktree (stored inside the git directory, so it is never committed).
- `mk plan resolve` returns that plan, or else the one active, unfinished plan whose `branch` matches the current branch. No match exits 1; several matches exit 3 and name them.
- `mk plan show <plan> --json` returns front matter, phases and checklist progress for a skill to consume. Read plan state this way, not from GitHub issue comments.

## GitHub issue = optional visibility projection, never canonical

- Publishing is the agent's job with `gh` / the GitHub API; `mk plan` has no publish command.
- It is never required and never the source of truth. Skip it in a repo with no GitHub remote, no `gh` auth, or when the user does not ask. When asked but unavailable, report one line (e.g. `gh auth login`).
- Publishing never overwrites the body of a pre-existing issue a plan came from (`mk-issue-to-plan`); it only adds links, comments or labels.
- If a linked issue and the files disagree on status, the files win.

### Publish-safety protocol

1. **Gate every publish.** Confirm the target repo or issue visibility suits the content, then scan the rendered text for secrets. Never project raw logs, env values, tokens, credentials or local absolute paths. Over GitHub's 65,536-character comment limit, link to the repo-relative plan path instead of splitting.
2. **Record linkage in the plan.** `mk plan update <plan> --issue <n>` stores the issue number in `plan.md`. Per-phase or root comment ids, when you need them, go in a `Tracking:` line in the plan body.
3. **Adopt before you create.** Embed a marker in every projected comment: `<!-- mk-plan <plan-dir-basename> hash=<12-hex> branch=<branch> -->`. Before creating a root comment, scan the issue for that marker; on a unique self-authored match, adopt it instead of posting a duplicate.
4. **Author-verify before editing.** Only edit a comment the current `gh` identity wrote. On a mismatch, or a missing or edited marker, append a new marked comment instead.
5. **Hash for idempotency.** The marker's hash covers the rendered body: equal hash means skip the write; a missing or changed marker means someone else touched it, so append. The projection is regenerable and the files win.
6. **Fail safe.** A 404 or 410 means report and stop; never auto-create a replacement issue. On rate limits or partial writes, back off and report; never retry-loop.

## Delivery finalisation (close on ship)

When a plan-backed change ships, finalise the plan so it stops reading as active work.

**Before the ship commit, finalise the files:**

1. `mk plan resolve`. A miss means no plan for this branch: skip silently (most ships carry none). Only an ambiguity, or a failure partway through, warrants a warning with the plan path.
2. `mk plan status` shows progress. Tick boxes the diff proves done with `mk plan check`. If the work is genuinely partial, `mk plan update <plan> --status in-progress` and stop; never blind-complete.
3. When the plan's `feature` is set, `mk verify <ID>` must pass first; that is the evidence the outcome holds.
4. `mk plan update <plan> --status completed`. It warns when items are open or the linked feature is not `passing`; resolve the warning rather than ignoring it. Stage only the owned plan files (`git add -- <plan-paths>`) so `status: completed` lands in the same merge as the code it describes.

Do **not** close the plan yet: during review it stays `state: active` so cook and review-fix cycles still resolve it, and a rejected PR must not leave a closed plan behind.

**After PR creation:** `mk plan update <plan> --linked-pr <n>`.

**After merge:**

1. Match the merged PR to the plan through `linked_pr` (or plan branch equal to the PR head branch). No match means unrelated or already closed: skip; on ambiguity, skip and report.
2. `mk plan close <plan>` sets `state: closed` in `plan.md`; commit that change with the next routine commit or a small follow-up.
3. Optional projection: append a new marked "plan completed, PR #N merged" comment, applying the publish gates above.

Degrade honestly: if any step fails, report the plan path and the reason and finish the delivery with a warning. Never delete plan files.
