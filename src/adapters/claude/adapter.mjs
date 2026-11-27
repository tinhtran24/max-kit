import { execFileSync } from "node:child_process";
import { GENERATED } from "../agents-md/render.mjs";

const TOOL_KINDS = {
  Bash: "shell",
  Edit: "edit",
  MultiEdit: "edit",
  NotebookEdit: "edit",
  Write: "write",
  Read: "read",
  Grep: "search",
  Glob: "search",
  WebFetch: "web",
  WebSearch: "web"
};

const EVENT_NAMES = {
  session: "SessionStart",
  prompt: "UserPromptSubmit",
  "pre-tool": "PreToolUse",
  stop: "Stop"
};

function hasCli() {
  try {
    execFileSync("claude", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export default {
  id: "claude",
  displayName: "Claude Code (CLI, IDE extensions, desktop)",
  minKitVersion: "0.1.0",
  capabilities: {
    instructions: "import",
    skills: "plugin",
    agents: "plugin",
    hooks: ["session", "prompt", "pre-tool", "stop"],
    plugin: "native",
    blocking: "json",
    ask: true
  },
  toolKinds: TOOL_KINDS,

  detect() {
    const cli = hasCli();
    return { used: cli, note: cli ? "claude CLI found" : "claude CLI not on PATH" };
  },

  render(model) {
    const packFiles = [
      ...(model.packSkills || []).flatMap((skill) => skill.files.map((f) => ({ path: `.claude/skills/${skill.name}/${f.path}`, content: f.content }))),
      ...(model.packAgents || []).map((a) => ({ path: `.claude/agents/${a.name}.md`, content: a.raw }))
    ];
    return [
      ...packFiles,
      {
        path: "CLAUDE.md",
        content: `${GENERATED}
@AGENTS.md

## Claude Code

- The max-kit plugin injects \`${model.teamRulesPath}\` at session start and guards pushes, deploy-branch edits, hand-written migrations and risky commands. Install it with \`npx max-kit install claude\`.
- Use the \`harness\` skill to pick, verify, record and close a task.
- Boot confirmation: "Loaded AGENTS.md, knowledge/synthesis/agent-boot.md and knowledge/harness/features-index.md."
`
      }
    ];
  },

  hookBridge: {
    parse(raw, event) {
      const p = raw ? JSON.parse(raw) : {};
      const name = p.tool_name || "";
      return {
        event,
        runtime: "claude",
        cwd: p.cwd || process.cwd(),
        sessionId: p.session_id || "",
        stopActive: Boolean(p.stop_hook_active),
        prompt: p.prompt || "",
        tool: {
          name,
          kind: TOOL_KINDS[name] || (name ? "other" : ""),
          command: p.tool_input?.command || "",
          filePath: p.tool_input?.file_path || p.tool_input?.notebook_path || ""
        }
      };
    },

    respond(event, decision) {
      if (!decision) return { stdout: "", exitCode: 0 };
      const hookEventName = EVENT_NAMES[event];
      if (decision.type === "context") {
        return { stdout: JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: decision.text } }), exitCode: 0 };
      }
      if (event === "pre-tool" && (decision.type === "deny" || decision.type === "ask")) {
        return {
          stdout: JSON.stringify({ hookSpecificOutput: { hookEventName, permissionDecision: decision.type, permissionDecisionReason: decision.reason } }),
          exitCode: 0
        };
      }
      if (event === "stop" && decision.type === "block") {
        return { stdout: JSON.stringify({ decision: "block", reason: decision.reason }), exitCode: 0 };
      }
      return { stdout: "", exitCode: 0 };
    }
  },

  install({ source }) {
    const steps = [
      ["plugin", "marketplace", "add", source],
      ["plugin", "install", "max-kit@max-kit"]
    ];
    for (const args of steps) execFileSync("claude", args, { stdio: "inherit" });
    return ["Restart Claude Code, then check /plugin and /hooks."];
  }
};
