# Writing a runtime adapter

An adapter teaches max-kit one agent runtime: which files it reads, how its hooks talk, and how to install into it. Core never changes when a runtime is added.

## Where adapters come from

| Source | How it is found |
| --- | --- |
| Built in | `src/adapters/<id>/adapter.mjs`, registered in `src/adapters/registry.mjs` (today: `claude`, `codex`, `agents-md`) |
| npm package | Any installed package named `max-kit-adapter-*` (or `@scope/max-kit-adapter-*`) |
| Local module | A path in `max-kit.config.json` › `adapters`, relative to the knowledgebase |

`max-kit adapters list` shows every adapter found and where it came from. Add its id to `targets` to render for it.

## Contract

```js
export default {
  id: "example",                 // lower-case kebab, unique
  displayName: "Example CLI",
  minKitVersion: "0.1.0",
  capabilities: {
    instructions: "native",      // native | import | none : reads AGENTS.md itself, imports it, or neither
    skills: "none",              // native | plugin | none
    agents: "none",
    hooks: [],                   // any of: session, prompt, pre-tool, stop
    plugin: "none",
    blocking: "none",            // how a guard denies a call: json | exit-code-2 | none
    ask: false                   // can a hook ask the user? if false, "ask" follows guards.askFallback
  },
  detect({ cfg }) { return { used: true, note: "example found" }; },
  render(model) { return [{ path: ".example/rules.md", content: "..." }]; },
  hookBridge: {                  // required when capabilities.hooks is not empty
    parse(raw, event) { /* runtime payload -> GuardInput */ },
    respond(event, decision) { /* Decision -> { stdout, exitCode } */ }
  },
  install({ source }) { return ["next step for the user"]; }   // optional
};
```

### render(model)

Pure: return files, never write them. `sync` writes, `sync --dry-run` lists, `sync --check` fails when a file on disk differs. Start generated files with the `GENERATED` header from `src/adapters/agents-md/render.mjs` when the format allows comments.

`AGENTS.md` is rendered once by core for every target whose `instructions` is not `none`. When any target lacks a `session` hook, the team rules are written into `AGENTS.md` instead of being linked, so runtimes without hooks still get them. Two adapters rendering the same path with different content is an error.

The model passed in:

| Field | Meaning |
| --- | --- |
| `project`, `idPrefix`, `root` | From the config |
| `repos` | `{ id, path, profile, testCommand, migrationGenerator }` |
| `branches` | `{ protected, deploy }` |
| `readOrder` | Boot files in order |
| `teamRulesPath`, `teamRules` | Path and text of the team rules |
| `commands` | `[command, description]` pairs |

### hookBridge

The runtime calls `max-kit hook <event> --runtime <id>` with its payload on stdin.

`parse` returns the neutral input:

```js
{
  event: "pre-tool",
  runtime: "example",
  cwd: "/path/the/agent/is/in",
  stopActive: false,            // true when the runtime is re-running a stop hook
  tool: {
    name: "apply_patch",
    kind: "write",              // shell | edit | write | read | search | web | other
    command: "",                // shell command text, for kind "shell"
    filePath: "",               // single-file tools
    files: [{ path: "db/migrate/1_add_total.rb", op: "add" }]   // multi-file tools; op: add | write | update | delete
  }
}
```

Fill `files` when one call touches several files (patches); guards read `files` first and fall back to `filePath`. Use kind `write` when the call creates a file, so the migration guard sees it.

Tool kinds: `shell`, `edit`, `write`, `read`, `search`, `web`, `other`. Map the runtime's tool names onto them.

`respond` receives `null` or one decision and returns what the runtime expects:

| Decision | Meaning |
| --- | --- |
| `{ type: "context", text }` | Add text to the agent's context (session, prompt) |
| `{ type: "deny", reason }` | Block the tool call |
| `{ type: "ask", reason }` | Ask the user before the tool call |
| `{ type: "block", reason }` | Do not stop yet; continue with the reason |

Set `capabilities.ask: false` when the runtime cannot ask from a hook. Core then turns `ask` into `deny` (default) or into a context warning when the knowledgebase sets `guards.askFallback: "warn"`. Any exception in the hook path fails open.

## Checklist for a new adapter

1. Read the runtime's current official docs for its instruction file, skill folder, hook events, payloads and exit codes.
2. Create the adapter (built in or as a package) and fill `capabilities` honestly.
3. Record real hook payloads under `test/fixtures/<id>/` and add guard tests that replay them.
4. Add golden files for `render` under `test/golden/<id>/` (`UPDATE_GOLDEN=1 npm test` writes them; review the diff).
5. Add the id to a knowledgebase's `targets`, run `max-kit sync --dry-run`, then `sync`, then `check`.
