# Harness Feature Index

Generated from `harness/features/*.yml`. Do not edit by hand; run `npm run index`.

Read this at boot to choose the feature id, then open only `harness/features/<ID>.yml`.

## State Summary

draft: 0, reviewable: 0, active: 3, blocked: 0, passing: 15, retired: 0

## Feature Lookup

| ID | State | Area | Title | Last run |
| --- | --- | --- | --- | --- |
| MK-CLAUDE-001 | active | adapters | Claude Code adapter: plugin, hooks, CLAUDE.md import and adapter registry | 2026-11-27 |
| MK-CODEX-001 | active | adapters | Codex CLI adapter: AGENTS.md, .agents/skills, .codex/hooks.json bridge, apply_patch parsing, ask fallback | 2026-11-27 |
| MK-CORE-001 | passing | core | CLI and harness core: init, check, sync, new feature and run, log, index, rollup | 2026-11-27 |
| MK-DETECT-001 | passing | profiles | Stack profiles and detection: rails, laravel, node, django, go; detect and init --detect | 2026-11-27 |
| MK-GUARD-001 | passing | guards | Guards: boot context, protected push, deploy-branch edit, migration, risky command, evidence at stop | 2026-11-27 |
| MK-IMPROVE-001 | passing | improve | mk improve: content-free session and guard events with a session-start nudge | 2026-11-27 |
| MK-PACKS-001 | passing | packs | Skill packs and port tooling: mk alias, pack loading and rendering, skills lint, port script | 2026-11-27 |
| MK-PORT-001 | passing | packs | Migration batch 1: workflow pack, clean skills and agents | 2026-11-27 |
| MK-PORT-002 | passing | packs | Migration batch 2: workflow pack complete, mk plan and mk prefs | 2026-11-27 |
| MK-PORT-003 | passing | packs | Migration batch 3: continuity pack, mk journal and mk handoff | 2026-11-27 |
| MK-PORT-004 | passing | packs | Migration batch 4: delivery pack, mk lang, mk pr-body, identifier-aware porting | 2026-11-27 |
| MK-PORT-005 | passing | packs | Migration batch 5: docs and diagrams packs | 2026-11-27 |
| MK-PORT-006 | passing | packs | Migration batch 6a: frontend pack with short skill names | 2026-11-27 |
| MK-PORT-007 | passing | packs | Migration batch 6b: backend and mobile packs with short names | 2026-11-27 |
| MK-PORT-008 | passing | packs | Migration batch 7: ops, quality, media and security-intel packs | 2026-11-27 |
| MK-PORT-009 | active | packs | Migration batch 8: orchestration pack and dogfood (orchestrate deferred) | 2026-11-27 |
| MK-SECRETS-001 | passing | security | Secrets: local encrypted vault (mk secrets), agent approvals, output redaction, secret-file guard, mk-vault skill | 2026-11-27 |
| MK-VERIFY-001 | passing | harness | Trustworthy evidence: verify command, acceptance criteria, stale evidence, verifier agent, redaction | 2026-11-27 |
