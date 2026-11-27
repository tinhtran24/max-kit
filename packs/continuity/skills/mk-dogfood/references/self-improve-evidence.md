# Self-improve evidence

Read this only when the run has `--evidence <event-ids>`. The ids come from the session-start nudge or from `mk improve status`, which lists the sessions where a skill hit tool errors.

## Event fields

`mk improve` keeps one record per session in the knowledgebase's `.max-kit/improve/`, on this machine only. Read them with `mk improve events --json`, never by path. The fields this review relies on:

| Field | Meaning |
|---|---|
| `id` | 10 hex characters; the value passed to `--evidence` (comma-separated). |
| `kind` | `session` for a session record; `guard` records are guard hits and are not evidence for a skill. |
| `runtime` | `claude` or `codex`. |
| `started`, `at` | When the session's first and latest stop were recorded. |
| `skills` | `[{ name, uses }]`: skills invoked in the session. |
| `tool_calls`, `tool_errors` | Counts for the whole session. |
| `skill_errors` | `{ <skill>: <count> }`: tool errors after that skill was invoked. |

Records carry names and counts only: no prompt or transcript text, tool input or output, secrets or paths. A record that holds anything else is invalid: report it and do not repeat the content. This run records nothing of its own.

## Read and validate

1. Read the records with `mk improve events --json` and keep only the listed ids. When the command is missing or fails, report "improve events not readable: <reason>" and stop; do not fall back to the live transcript.
2. Mark an id invalid, with the reason, when it is not found, is not a `session` record, lacks `skills`, names no skill matching `--skill`, or holds free text.
3. With no valid record left, write the report with "no valid evidence" and no proposals.

## Review

- Counts show where trouble clustered; they do not prove a root cause. Recurrence is the number of distinct session records with errors for the same skill.
- Classify each group with the four finding classes of `session-review.md`. Errors alone are weak evidence: they become a skill defect or a preventable agent mistake only when the skill text plausibly caused them (cite the `file:line`); otherwise class them environment or one-off.
- Each finding cites its record ids. Never invent an id, a session detail or an error message the records do not carry.

## Policy

| Owner | Allowed outcome |
|---|---|
| max-kit pack skill | Proposal; a PR in the contributor lane only when the user directs it in a separate step. |
| Third-party skill (plugin, marketplace) | Proposal, or a user-owned fork the user creates later. |
| User or project authored | Proposal; the user applies it, or reruns without `--evidence` and with `--apply`. |

`--apply` is refused in this mode with one line naming the follow-up. An eval that cannot finish is `not_run` or `inconclusive`, never an error and never a verified improvement.
