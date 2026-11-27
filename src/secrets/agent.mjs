const MARKERS = ["CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT", "CODEX_SANDBOX", "CODEX_SANDBOX_NETWORK_DISABLED", "CODEX_THREAD_ID", "CURSOR_AGENT", "GEMINI_CLI", "MK_AGENT"];

export function agentMarker(env = process.env) {
  return MARKERS.find((k) => env[k] && env[k] !== "0") || null;
}

export function underAgent(env = process.env) {
  return Boolean(agentMarker(env));
}

export function userTerminal(env = process.env) {
  return !underAgent(env) && Boolean(process.stdin.isTTY && process.stdout.isTTY);
}
