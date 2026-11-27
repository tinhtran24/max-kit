# Team Rules

The single source for rules that apply to every session in every repo of this workspace. The max-kit hooks inject this file at session start, and `npm run check` fails when it passes the boot budget in `max-kit.config.json`. Guards back up parts of it; they are a backstop, not the rule.

## Safety: stop and ask first

Before any action that could affect a customer, partner or shared environment, stop and ask in chat:

- App features that send to a real person: email, SMS, push, chat, webhooks, calendar invites.
- Starting anything scheduled or queued: workers, cron, schedulers, a full-stack compose up.
- Touching staging or production: databases, caches, buckets, deploys, infrastructure.
- Putting real customer data into seeds, fixtures, evidence or screenshots. Use fake data.

When asking, state the exact command, who could be affected and a safer alternative.

## Database: local only

- Never connect to a shared database, read-only included, unless the user asks in chat for one specific query.
- Confirm the host is local before every database command. Rebuild production-only bugs locally with fake data.
- Before a bulk update, delete, drop or restore, take a dump or confirm with the user.
- Generate schema migrations with the repo's own command; never hand-write the file.

## Branches and commits

- Implement only on development branches. Deploy branches are never edited.
- Never push to a protected branch; create a task branch and push that.
- Commit or open a pull request only when the user asks.

## Order of work

1. Understand first: root cause for a bug, a measurement for performance.
2. Write the failing test before the fix (copy, styling and config changes skip this).
3. Non-obvious fix: write a short approach (cause, options, choice, blast radius, rollback) in the run file. Schema, new dependency or cross-repo change: get the user's yes first.
4. Implement the smallest change that passes, then verify by tier.

## Verification tiers

- **High risk** (business logic, data writes, queries, migrations, auth, money, workers, imports and exports, routes): independent review by a fresh agent given the code, runtime checks, then a second fresh review of the final diff.
- **Low risk** (copy, styling, docs, tests only, config with no behaviour change): one review of the diff plus the tests it touches.
- Unsure means high risk. State the tier in the run file and the pull request.

## Two-round limit

After two fix rounds that still fail, stop. Tell the user what each round changed, what still fails, which assumption may be wrong, and two or three options. Wait for an answer.

## Comments

Default to none. Add one line only when the code would mislead without it. No ticket codes, dates or change history in comments.

## Done

No evidence means not done. Record verification in `knowledge/harness/runs/` or record the blocker.
