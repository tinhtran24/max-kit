# Knowledge

Detailed edit boundaries and workflows. Read only when they matter; the boot path is [synthesis/agent-boot.md](synthesis/agent-boot.md). Paths here are relative to `knowledge/`.

## Layers

| Layer | Holds | Never holds |
| --- | --- | --- |
| `business/` | Stable meaning: domains, entities, workflows, glossary, decisions | Code walkthroughs, raw captures |
| `raw/` | Captured evidence: exports, tickets, emails, documents | Conclusions |
| `harness/` | Features (one file each), runs (evidence), verifiers | Backlog items without a trigger |
| `incidents/` | Production failures: impact, cause, fix, prevention | Ordinary bugs with no production impact |
| `maintenance/` | Conflicts, open questions, review queue | Resolved items |
| `log/` | One file per month; generated `index.md` | Edits to past months except fixes |
| `synthesis/` | Boot files, team rules, generated recent changes | Anything long |

## Edit policy

- **Free to edit during knowledge work:** `business/`, `maintenance/`, `incidents/`, the current month of `log/` (through `npm run log`).
- **Only when evidence is added:** `harness/features/*.yml`, `harness/runs/`.
- **Only when the operating model changes, with the user's yes:** `synthesis/`, `../max-kit.config.json`.
- **Generated, never by hand:** `harness/features-index.md`, `log/index.md`, `synthesis/recent-changes.md`, `../AGENTS.md`, `../CLAUDE.md`.
- **Kit-owned, refreshed by `max-kit update`:** this file, `templates/`, `harness/README.md`, `harness/runs/README.md`.
- **Never write:** secrets, tokens, real customer data, generated code-index caches.

## Workflows

### Harnessed task

Use the `harness` skill: pick or create the feature, verify, record a run, move state, log, run `npm run check`.

### Ingest

1. Put the capture in `raw/` with its source and date.
2. Write conclusions in `business/`, linking back to the raw file.
3. Record contradictions in `maintenance/conflicts.md` and gaps in `maintenance/open-questions.md`.
4. `npm run log -- ingest "<source title>"`.

### Incident

1. Copy `templates/incident.md` to `incidents/INC-YYYYMMDD-<slug>.md`; add it to `incidents/_index.md`.
2. Create or link a harness feature with `trigger.type: incident` whose verification proves the fix.
3. `npm run log -- incident "<title>"`.

### Decision

Copy `templates/decision.md` to `business/decisions/`; link it from the pages it changes; log it with kind `decide`.

### Query

Answer from `business/` first, then `raw/` for evidence, then the code for current behaviour. When they disagree, the code wins: record it in `maintenance/conflicts.md`.

## After-task checklist

- [ ] Harness feature state matches reality; evidence recorded or blocker named.
- [ ] Business impact updated, or "no impact" stated with the reason.
- [ ] `npm run log -- <kind> "<title>"`, `npm run index`, `npm run rollup`.
- [ ] `npm run check` passes.
