# UI Fix Workflow

For fixing visual and interaction issues.

## Required Skills

Activate in order:

1. `mk-uiux` for design-system and UX guidance
2. `mk-frontend-design` for implementation patterns

## Pre-Fix Research

```bash
python ${CLAUDE_PLUGIN_ROOT}/skills/mk-uiux/scripts/search.py "<product-type>" --domain product
python ${CLAUDE_PLUGIN_ROOT}/skills/mk-uiux/scripts/search.py "<style>" --domain style
python ${CLAUDE_PLUGIN_ROOT}/skills/mk-uiux/scripts/search.py "accessibility" --domain ux
```

## Workflow

Analyze screenshots or videos with `mk-ai-multimodal`, read the project's routed design
guidance when present, and identify the exact discrepancy. Fix it following existing component
patterns. Capture the affected container and compare it with the accepted design; if it is
still wrong, fix again. Check interaction, console and network behavior with
`mk-agent-browser`, Chrome MCP / `chrome-devtools-mcp`, or project-native browser tests, then
run compilation and the affected UI tests. Update routed design guidance only when the accepted
design contract changed.
