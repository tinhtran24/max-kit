---
name: mk-help
description: "Find the max-kit skill, command or workflow that fits a request, from what is installed in this project."
when_to_use: "Invoke when users ask how to use max-kit, which skill or workflow fits a task, or what a command does."
category: meta
keywords: [help, index, commands, skills, usage]
argument-hint: "[topic|skill|command]"
metadata:
  author: max-kit
  version: "2.0.0"
---

# Help

Answer from what is installed, never from a remembered list.

- **Skills**: use the runtime's installed-skill catalog. In a knowledgebase, `mk skills list` shows each pack with its skills and agents, and `max-kit.config.json` › `packs` shows which are enabled. Read front matter only for the candidates that fit the request.
- **Commands**: `mk --help` lists every command; `mk <command> help` (for example `mk plan help`, `mk secrets help`) gives its subcommands. Quote only the command the user asked about.
- **Workflows**: a task that needs proof of done goes through the harness (`knowledge/harness/features-index.md`, then `mk verify`); planning goes through `mk-plan` and `mk plan`; shipping through `mk-ship`.

Route to the most specific installed skill when the task is clear, and say plainly when the skill that would fit lives in a pack that is not enabled (name the pack and the config line to add). When two skills could own the request, name both and the deciding question instead of picking the first match.
