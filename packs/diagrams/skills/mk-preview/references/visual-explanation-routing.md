# Visual Explanation Routing

Use this file when a workflow asks for a visual explanation, diagram, slide deck,
diff review, or recap. Load `../SKILL.md` first for command syntax, then use this
file to choose the mode.

## Mode Selection

| Need | Preview mode |
|---|---|
| View an existing Markdown file or directory | `/mk-preview <path>` |
| Explain a concept or code path | `/mk-preview --explain <topic>` |
| Generate a focused architecture/data-flow diagram | `/mk-preview --diagram <topic>` |
| Terminal-friendly diagram only | `/mk-preview --ascii <topic>` |
| Self-contained HTML explanation | `/mk-preview --html --explain <topic>` |
| Slide deck | `/mk-preview --html --slides <topic>` |
| Visual diff review for a branch, PR, or commit | `/mk-preview --html --diff [ref]` |
| Compare an implementation plan to code | `/mk-preview --html --plan-review <plan>` |
| Recap recent project context | `/mk-preview --html --recap [timeframe]` |

## Specialist Handoffs

- Mermaid syntax: load `/mk-mermaidjs-v11`.
- Publish-grade SVG/PNG architecture diagrams (non-templated): use
  `/mk-tech-graph`.
- Generated images or multimodal analysis: use `/mk-ai-multimodal`.
- UI/UX style selection for slides or high-polish HTML: use
  `/mk-uiux`.
- Documentation update after a durable visual: use `/mk-docs update` and
  `../../docs/references/documentation-management.md`.

## Output Rules

- Prefer the active plan's `visuals/` folder when a plan exists.
- If no plan exists, save under `plans/visuals/`.
- For HTML output, always include the theme toggle required by
  `html-css-patterns.md`.
- For diagrams, render and inspect the output; syntax validity alone is not
  enough.
