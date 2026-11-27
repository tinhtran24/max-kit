import { findRoot, loadConfig } from "../core/config.mjs";
import { loadAdapters } from "../adapters/registry.mjs";

const fmt = (v) => (Array.isArray(v) ? v.join(",") || "-" : v);

export default async function adapters(argv) {
  const [sub = "list", id] = argv;
  const root = findRoot();
  const cfg = root ? loadConfig(root) : null;
  const { adapters: all, problems } = await loadAdapters(cfg);
  for (const p of problems) console.warn(`warn: ${p}`);

  if (sub === "list") {
    const rows = [...all.values()].map(({ adapter: a, source }) => [a.id, a.displayName || "", source, cfg?.targets.includes(a.id) ? "yes" : ""]);
    const head = ["id", "runtime", "source", "target"];
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
    for (const r of [head, ...rows]) console.log(r.map((c, i) => c.padEnd(widths[i])).join("  "));
    return 0;
  }
  if (sub === "show" && id) {
    const entry = all.get(id);
    if (!entry) {
      console.error(`unknown adapter ${id}`);
      return 1;
    }
    const a = entry.adapter;
    console.log(`${a.id}: ${a.displayName || ""} (${entry.source})`);
    for (const [k, v] of Object.entries(a.capabilities)) console.log(`  ${k.padEnd(12)} ${fmt(v)}`);
    const d = a.detect?.({ cfg });
    if (d) console.log(`  detected     ${d.used ? "yes" : "no"}${d.note ? ` (${d.note})` : ""}`);
    return 0;
  }
  console.error("usage: max-kit adapters list | adapters show <id>");
  return 2;
}
