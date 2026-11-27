---
features: [MK-CORE-001, MK-CLAUDE-001, MK-GUARD-001]
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: "c646bb9"
---

# Run 2026-11-27: phase-1-tests

## Approach

New repo, no existing users: blast radius is the kit itself. High tier because the guards decide which agent actions are blocked. Rollback: revert the branch.

## Verification

| Round | Covered | Result |
| --- | --- | --- |
| 1 | CLI, harness lint and generators, guards via recorded Claude payloads, adapter golden files, external adapter loading | passed |

```sh
npm test
npm run check
node bin/max-kit.mjs doctor
claude plugin validate .
```

Output summary: `ℹ tests 33 ℹ pass 33 ℹ fail 0`; check: `check passed`; doctor: all good; plugin validate: passed with warnings (marketplace description now added; root CLAUDE.md is this repo's own knowledgebase file, not plugin context).

## Remaining

- Live Claude Code session with the installed plugin not yet exercised (MK-CLAUDE-001 unknown).
- CI matrix (Windows in particular) runs on the pull request.
- Licence not chosen yet; the plugin directory requires one before submission.
