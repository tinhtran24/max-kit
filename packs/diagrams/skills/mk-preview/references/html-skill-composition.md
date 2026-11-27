# Shared HTML Visual & Diagram Composition Contract

This document owns the canonical HTML generation, visual styling, and diagram orchestration protocol across all max-kit skills that produce HTML artifacts.

## Trigger Mapping

The unified HTML composition protocol activates whenever a skill produces an HTML artifact:

| Logical Skill | Skill file (under the installed skills root) | HTML Activation Trigger |
|---|---|---|
| `mk-explain` | `mk-explain/SKILL.md` | `--html` |
| `mk-brainstorm` | `mk-brainstorm/SKILL.md` | `--html` |
| `mk-plan` | `mk-plan/SKILL.md` | `--html` |
| `mk-preview` | `mk-preview/SKILL.md` | `--html`, and implied HTML modes (`--diff`, `--plan-review`, `--recap`) |
| `mk-advise` | `mk-advise/SKILL.md` | `--html` |
| `mk-show-off` | `mk-show-off/SKILL.md` | Every invocation (inherently HTML output) |
| `mk-retro` | `mk-retro/SKILL.md` | `--format html` |
| `mk-cti` | `mk-cti/SKILL.md` | `--format html` |
| `mk-issue-to-plan` | `mk-issue-to-plan/SKILL.md` | Mandatory downstream `mk-plan --html` delegation |

Non-HTML modes (Markdown, terminal CLI) do NOT activate visual capabilities or load this protocol.

## Canonical Activation Sequence

For an HTML artifact, resolve the relevant capabilities below. Reuse accepted design tokens,
current source evidence and already-loaded contracts; an update need not restart design.
Load library/style details only for the artifact and complexity that need them. View-only
operations never activate this sequence:

```text
1. Detect HTML Trigger Mode
   ↓
2. Query Live Skill Catalog (Runtime Discovery)
   ↓
3. Activate mk-frontend-design
   (Obtain Design Read, design tokens, typography, responsive shell, dark/light styles, a11y checks)
   ↓
4. Activate mk-diagram (When Installed)
   (Author typed JSON IR for archetype: architecture, workflow, sequence, dataflow, or lifecycle;
    compile trusted fragment)
   ↓
5. Single-Document Assembly
   (Invoking skill composes the single outer HTML document; embeds diagram fragment)
   ↓
6. Offline & Accessibility Verification
   (Zero network calls, keyboard navigation, visible focus, reduced motion, responsive containment)
```

## Responsibility Boundaries

- **Invoking Skill**: Owns the document shell (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`), factual narrative, artifact path, and final verification. Never compose competing nested documents or `<iframe>`s.
- **`mk-frontend-design`**: Owns layout architecture, typography hierarchy, token styling, container responsiveness, accessible navigation, and visual critique.
- **`mk-diagram`**: Owns typed JSON IR compilation, deterministic SVG geometry, and interactive reader tools (search, reach, route, lens, presentation stage, share cards).
- **Fragment Trust Boundary**: **Only compiler-produced typed IR fragments may be embedded.** Legacy raw HTML, Mermaid source, and unslotted templates remain standalone compatibility artifacts and must NEVER be embedded into composed documents.

## Fallback Matrix

| Collaborator State | Fallback Behavior |
|---|---|
| **Both Installed (`frontend-design` + `diagram`)** | Full interactive visual HTML document with embedded interactive diagram reader. |
| **Diagram Absent (e.g. Core-only, Marketing kit)** | Render a clean, semantic inline SVG/CSS diagram directly in the HTML document with `<title>`, `<desc>`, clear node labels, and directional arrows. Disclose reduced interaction capability in metadata. |
| **Diagram Present but Rejects Invalid IR** | Diagnose and repair the typed IR. If repair fails, use the labeled non-interactive semantic fallback. Never silently fall back to raw HTML or Mermaid. |
| **Frontend Design Absent (custom catalog)** | Use the built-in restrained accessible CSS tokens; do not fail or attempt network downloads. |
| **No Factual Graph Topology** | Activation occurs normally, but if content is non-relational, use structured cards/timelines rather than inventing artificial nodes and edges. |

## Verification Checklist

1. **100% Offline**: Document opens directly via `file://` with zero external network requests (no CDNs or Google Fonts).
2. **Accessibility**: Semantic headings (`<h1>`–`<h3>`), keyboard-operable controls, visible focus rings, sufficient contrast, and `@media (prefers-reduced-motion: reduce)` support.
3. **Responsive**: Layout scales cleanly across mobile (375px), tablet (768px), and desktop (1440px+) viewports without horizontal clipping.
