export default {
  id: "agents-md",
  displayName: "Any runtime that reads AGENTS.md",
  minKitVersion: "0.1.0",
  capabilities: {
    instructions: "native",
    skills: "none",
    agents: "none",
    hooks: [],
    plugin: "none",
    blocking: "none"
  },
  detect() {
    return { used: true, note: "AGENTS.md is read by most coding agents" };
  },
  render() {
    return [];
  }
};
