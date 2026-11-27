import { execFileSync } from "node:child_process";

const EVENT_NAMES = {
  session: "SessionStart",
  prompt: "UserPromptSubmit",
  "pre-tool": "PreToolUse",
  stop: "Stop"
};

const PATCH_OPS = [
  [/^\*\*\* Add File: (.+)$/, "add"],
  [/^\*\*\* Update File: (.+)$/, "update"],
  [/^\*\*\* Delete File: (.+)$/, "delete"],
  [/^\*\*\* Move to: (.+)$/, "add"]
];

export function patchFiles(patch) {
  const files = [];
  for (const line of String(patch || "").replace(/\r\n/g, "\n").split("\n")) {
    for (const [re, op] of PATCH_OPS) {
      const m = line.match(re);
      if (m) files.push({ path: m[1].trim(), op });
    }
  }
  return files;
}

const hookCommand = (event) => `npx --no-install max-kit hook ${event} --runtime codex`;
const handler = (event, statusMessage) => ({ type: "command", command: hookCommand(event), timeout: 30, statusMessage });

export function renderHooks() {
  return {
    hooks: {
      SessionStart: [{ hooks: [handler("session", "max-kit: loading boot context")] }],
      UserPromptSubmit: [{ hooks: [handler("prompt", "max-kit: harness reminder")] }],
      PreToolUse: [{ matcher: "^(Bash|apply_patch|Edit|Write)$", hooks: [handler("pre-tool", "max-kit: checking guards")] }],
      Stop: [{ hooks: [handler("stop", "max-kit: checking evidence")] }]
    }
  };
}

function hasCli() {
  try {
    execFileSync("codex", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export default {
  id: "codex",
  displayName: "Codex CLI (and IDE extension)",
  minKitVersion: "0.1.0",
  capabilities: {
    instructions: "native",
    skills: "native",
    agents: "none",
    hooks: ["session", "prompt", "pre-tool", "stop"],
    plugin: "none",
    blocking: "json",
    ask: false
  },

  detect() {
    const cli = hasCli();
    return { used: cli, note: cli ? "codex CLI found" : "codex CLI not on PATH" };
  },

  render(model) {
    const files = [{ path: ".codex/hooks.json", content: `${JSON.stringify(renderHooks(), null, 2)}\n` }];
    for (const skill of model.skills || []) {
      for (const f of skill.files) files.push({ path: `.agents/skills/${skill.name}/${f.path}`, content: f.content });
    }
    return files;
  },

  hookBridge: {
    parse(raw, event) {
      const p = raw ? JSON.parse(raw) : {};
      const name = p.tool_name || "";
      const input = p.tool_input && typeof p.tool_input === "object" ? p.tool_input : {};
      const command = Array.isArray(input.command) ? input.command.join(" ") : String(input.command ?? "");
      const tool = { name, kind: "", command: "", filePath: "", files: [] };
      if (name === "Bash") Object.assign(tool, { kind: "shell", command });
      else if (name === "apply_patch" || name === "Edit" || name === "Write") {
        tool.files = patchFiles(command);
        tool.kind = tool.files.some((f) => f.op === "add") ? "write" : "edit";
      } else if (name) tool.kind = "other";
      return {
        event,
        runtime: "codex",
        cwd: p.cwd || process.cwd(),
        sessionId: p.session_id || "",
        stopActive: Boolean(p.stop_hook_active),
        prompt: p.prompt || "",
        tool
      };
    },

    respond(event, decision) {
      if (!decision) return { stdout: "", exitCode: 0 };
      const hookEventName = EVENT_NAMES[event];
      if (decision.type === "context") {
        return { stdout: JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: decision.text } }), exitCode: 0 };
      }
      if (event === "pre-tool" && decision.type === "deny") {
        return { stdout: JSON.stringify({ hookSpecificOutput: { hookEventName, permissionDecision: "deny", permissionDecisionReason: decision.reason } }), exitCode: 0 };
      }
      if (event === "stop" && decision.type === "block") {
        return { stdout: JSON.stringify({ decision: "block", reason: decision.reason }), exitCode: 0 };
      }
      return { stdout: "", exitCode: 0 };
    }
  },

  install() {
    return [
      "Codex reads AGENTS.md, .agents/skills/ and .codex/hooks.json from this folder after npm run sync.",
      "Open Codex in this folder and run /hooks to review and trust the max-kit hooks; untrusted project hooks do not run.",
      "Hooks call npx --no-install max-kit, so run npm install here first."
    ];
  }
};
