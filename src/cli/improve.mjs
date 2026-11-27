import { loadConfig, requireRoot } from "../core/config.mjs";
import { clearEvents, enabled, nudges, readEvents, status } from "../improve/events.mjs";
import { parseArgs } from "./args.mjs";

export default async function improve(argv) {
  const o = parseArgs(argv.slice(1), { flags: ["json", "yes"], options: ["skill", "limit"] });
  const cfg = loadConfig(requireRoot());
  const sub = argv[0] || "status";
  switch (sub) {
    case "status": {
      const s = status(cfg.root);
      const skills = o.options.skill ? s.skills.filter((k) => k.name === o.options.skill) : s.skills;
      if (o.flags.json) {
        console.log(JSON.stringify({ enabled: enabled(cfg), ...s, skills }, null, 2));
        return 0;
      }
      console.log(`recording ${enabled(cfg) ? "on" : "off"}; last ${s.window_days} days, ${s.sessions} session(s)`);
      for (const k of skills) console.log(`  ${k.name.padEnd(28)} ${k.sessions} session(s), ${k.uses} use(s), errors in ${k.error_sessions}${k.event_ids.length ? `  evidence ${k.event_ids.join(",")}` : ""}`);
      for (const g of s.guards) console.log(`  guard ${g.guard.padEnd(22)} ${g.hits} hit(s) ${JSON.stringify(g.decisions)}`);
      return 0;
    }
    case "events": {
      let events = readEvents(cfg.root);
      if (o.options.skill) events = events.filter((e) => e.kind === "session" && (e.skills || []).some((s) => s.name === o.options.skill));
      events = events.reverse().slice(0, o.options.limit ? Number(o.options.limit) : 50);
      if (o.flags.json) console.log(JSON.stringify(events, null, 2));
      else for (const e of events) console.log(`${e.id}  ${e.at}  ${e.kind === "session" ? `session: ${(e.skills || []).map((s) => s.name).join(", ") || "no skills"}; ${e.tool_errors || 0} tool error(s)` : `guard ${e.guard} ${e.decision}`}`);
      return 0;
    }
    case "nudge": {
      for (const l of nudges(cfg.root, { remember: false })) console.log(l);
      return 0;
    }
    case "clear": {
      if (!o.flags.yes) {
        console.error("mk improve clear removes all recorded events on this machine; rerun with --yes");
        return 2;
      }
      clearEvents(cfg.root);
      console.log("cleared");
      return 0;
    }
    default:
      console.log(`usage: mk improve <command>

  status [--skill name] [--json]   skills used, sessions with tool errors, guard hits (last 14 days)
  events [--skill name] [--limit N] [--json]
  nudge                            what the next session start would suggest
  clear --yes

Events hold names and counts only (no prompts, code or output) and stay in .max-kit/improve on this machine.
Turn recording off with "improve": { "enabled": false } in max-kit.config.json.`);
      return sub ? 2 : 0;
  }
}
