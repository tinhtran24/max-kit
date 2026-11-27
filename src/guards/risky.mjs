export default {
  id: "risky-command",
  events: ["pre-tool"],
  decide(input, cfg) {
    const { tool } = input;
    if (tool.kind !== "shell" || !tool.command) return null;
    for (const pattern of cfg.guards.riskyCommands) {
      let re;
      try {
        re = new RegExp(pattern, "im");
      } catch {
        continue;
      }
      if (re.test(tool.command)) {
        return {
          type: "ask",
          reason: `Safety check: this command matches '${pattern}' and may touch a shared environment, start workers or reach real people. Confirm the target is local, or use a safer alternative.`
        };
      }
    }
    return null;
  }
};
