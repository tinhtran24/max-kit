---
features: [MK-CODEX-001]
date: 2026-11-27
result: passed
tier: high
repo: knowledgebase
commit: "610d7cd"
---

# Run 2026-11-27: phase-3-codex

## Approach

Codex docs (learn.chatgpt.com/docs/hooks.md, generated hook schemas in openai/codex) say ask is parsed but not supported and the tool call continues. Choice: turn ask into deny by default so risky commands are never silently allowed; askFallback warn is the opt-out. apply_patch has no file path field, so paths come from the patch headers. High tier: decides which agent actions are blocked. Rollback: revert the branch or drop codex from targets.

## Verification

| Round | Covered | Result |
| --- | --- | --- |
| 1 | Patch parsing; contract; golden hooks.json and skill; session context; protected push; ask to deny and to warn; migration add denied and update allowed via apply_patch; deploy branch; stop block; claude+codex knowledgebase passes check | passed |
| 2 | End to end: init --targets claude,codex with the kit installed from a local path, npm install, Codex PreToolUse payload piped to npx --no-install max-kit from a nested subfolder | deny returned in Codex format; check passed; doctor all good |

```sh
npm test
npm run check
# scratch knowledgebase
max-kit init e2e-kb --targets claude,codex --kit file:<kit>
npm install
echo '<PreToolUse Bash git push origin main>' | npx --no-install max-kit hook pre-tool --runtime codex
npx --no-install max-kit doctor
```

Output summary: `ℹ tests 56 ℹ pass 56 ℹ fail 0`.

## Remaining

- Live Codex session with trusted hooks not yet run (would use the user's Codex account).
- Codex plugin packaging (root plugin.json, marketplace) left for later; the docs place hooks under extensions.com.openai and say plugins with hooks are supported for manual installs in Codex desktop.
