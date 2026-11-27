---
name: mk-coding-level
description: "Set the user's coding experience level to tune explanation depth, code complexity and response format; only on an explicit user request."
when_to_use: "Invoke only when the user explicitly asks to set or change their coding level; never infer one."
category: meta
keywords: [experience, level, explanation, format]
argument-hint: "[0-5]"
metadata:
  author: max-kit
  version: "2.0.0"
---

# Coding Level

Set the coding experience level used to pitch explanations and output.

## Usage

`/mk-coding-level [0-5]`

## Levels

| Level | Name | Description |
|-------|------|-------------|
| 0 | ELI5 | Zero coding experience: analogies, no jargon, step by step |
| 1 | Junior | 0-2 years: concepts explained, why as well as how |
| 2 | Mid-level | 3-5 years: design patterns, system thinking |
| 3 | Senior | 5-8 years: trade-offs, business context, architecture |
| 4 | Tech lead | 8-10 years: risk, business impact, strategy |
| 5 | Expert | Default behaviour, maximum efficiency (default) |

## Apply and persist

Apply the level now to explanation depth, vocabulary and examples. Implementation scope, correctness, tests and security do not change with the level.

Persist it for later sessions:

```bash
mk prefs set codingLevel <0-5> --scope user      # this person, every project
mk prefs set codingLevel <0-5>                   # this knowledgebase only (shared with the team)
mk prefs get codingLevel                         # verify
```

Inside a max-kit knowledgebase the session-start hook states the resolved level, so every runtime with hooks picks it up. Without hooks, apply it for this session and say that it will not carry over.
