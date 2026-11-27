# max-kit Domain Routing

Use this file only when choosing between installed max-kit skills. If the user
asks to discover or install external skills, return to `../SKILL.md` and use the
Skills CLI flow.

## Routing Rules

- If the user names a skill, use that skill.
- Pick one primary skill per distinct intent. Mention secondary skills only as
  follow-up helpers.
- If the task needs a multi-step sequence, read
  `../../cook/references/workflow-routing.md` after choosing the primary skill.
- If two skills overlap, prefer the more specific domain skill over a generic
  workflow skill.

## Frontend and UI

| User intent | Primary skill |
|---|---|
| Replicate a mockup, screenshot, or video | `/mk-frontend-design` |
| Build React or TypeScript components | `/mk-frontend` |
| Style with Tailwind or shadcn/ui | `/mk-ui-styling` |
| Choose color, typography, layout, or design system | `/mk-uiux` |
| Audit UI accessibility or UX | `/mk-uiux` |
| Apply React or Next.js performance patterns | `/mk-react` |
| Generate UI designs with Stitch | `/mk-stitch` |
| Build 3D, WebGL, or Three.js scenes | `/mk-threejs` |
| Write shaders or procedural graphics | `/mk-shader` |
| Create an editable Excalidraw canvas or codebase map | `/mk-excalidraw` |

## Codebase Understanding

| User intent | Primary skill |
|---|---|
| Locate files or understand code quickly | `/mk-scout` |
| Pack a repository for LLM use | `/mk-repomix` |
| Semantic go-to-definition or find-usages | `/mk-gkg` |
| Build a queryable knowledge graph | `/mk-graphify` |

## Backend, Data, and Auth

| User intent | Primary skill |
|---|---|
| Build REST, GraphQL, or backend services | `/mk-backend` |
| Add auth, OAuth, sessions, or passkeys | `/mk-better-auth` |
| Design schemas or write SQL/NoSQL queries | `/mk-databases` |
| Integrate Stripe, Polar, Paddle, or SePay | `/mk-payments` |

## Infrastructure and Security

| User intent | Primary skill |
|---|---|
| Deploy to hosted platforms | `/mk-deploy` |
| Docker, Kubernetes, CI/CD, or cloud ops | `/mk-devops` |
| STRIDE/OWASP audit with remediation | `/mk-security` |
| Secret, dependency, or vulnerability scan | `/mk-security` (`--secrets-only`, `--deps-only`) |
| OSINT or cyber threat intelligence | `/mk-cti` |

## AI, MCP, and Browser Automation

| User intent | Primary skill |
|---|---|
| Context, memory, or agent architecture | `/mk-context-engineering` |
| Generate `llms.txt` | `/mk-llms` |
| Build Google ADK agents | `/mk-google-adk` |
| Build MCP servers | `/mk-mcp-builder` |
| Expose website features as in-browser agent tools (WebMCP) | `/mk-webmcp` |
| Convert code into CLI/MCP surface | `/mk-agentize` |
| Test generic browser workflows | `/mk-agent-browser` |
| Use the user's real Chrome profile | `/mk-chrome-profile` |

## Testing, Docs, and Media

| User intent | Primary skill |
|---|---|
| Run tests, coverage, or TDD gates | `/mk-test` |
| Playwright, Vitest, k6, visual or a11y tests | `/mk-web-testing` |
| Project docs init/update/summarize | `/mk-docs` |
| Library/framework docs lookup | `/mk-docs-seeker` |
| Visual explanation, preview, slides, or diagrams | `/mk-preview` |
| Editorial-grade PNG/SVG or animated MP4/GIF diagrams (24 templated types + animation catalog) | `/mk-diagram` |
| Mermaid syntax | `/mk-mermaidjs-v11` |
| Publish-grade technical diagrams (non-templated) | `/mk-tech-graph` |
| Video/audio/image processing | `/mk-media` |
| HTML-template video rendering | `/mk-hyperframes` |

## Planning, Research, and Agent Workflow

| User intent | Primary skill |
|---|---|
| Pressure-test a plan, design, or idea through an interview | `/mk-advise` |
| Draft a self-contained brief for a researcher | `/mk-research-prompt` |
| Preserve conversation state for a fresh agent | `/mk-handoff` |
| Hand the captured state to a selected coding runtime via orchestrate | `/mk-handoff --dispatch --agent <id>` |
| Extract user decisions into a README, ADR, or structured document | `/mk-interview-docs` |
| Create local context files for a subfolder | `/mk-folder-context` |
| Prepare / preflight a long-running goal with an outcome lock | `/mk-goal-warmup` |
| Run a durable Codex objective with a verifiable stop condition | `/mk-codex-goal` |
| Benchmark a coding model on DeepSWE through OpenRouter | `/mk-deep-swe` |

## Frameworks and Platforms

| User intent | Primary skill |
|---|---|
| Next.js, App Router, RSC, Turborepo | `/mk-web-frameworks` |
| TanStack Start/Form/AI | `/mk-tanstack` |
| React Native, Flutter, SwiftUI, Kotlin | `/mk-mobile` |
| Shopify apps, extensions, or themes | `/mk-shopify` |
