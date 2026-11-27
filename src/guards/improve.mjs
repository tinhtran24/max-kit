import { enabled, nudges, recordSession, summariseTranscript } from "../improve/events.mjs";

export default {
  id: "improve",
  events: ["session", "stop"],
  decide(input, cfg) {
    if (!enabled(cfg)) return null;
    if (input.event === "stop") {
      recordSession(cfg.root, input.sessionId, { runtime: input.runtime, ...summariseTranscript(input.transcriptPath) });
      return null;
    }
    const lines = nudges(cfg.root);
    return lines.length ? { type: "context", text: `max-kit improve:\n${lines.map((l) => `- ${l}`).join("\n")}` } : null;
  }
};
