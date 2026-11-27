import fs from "node:fs";

const section = (id, ...titles) => ({ id, patterns: titles.map((t) => new RegExp(`^#{2,3}\\s+${t}\\s*$`, "im")) });

export const REQUIRED_SECTIONS = [
  section("end-to-end-summary", "End-to-end work summary", "Tóm tắt công việc end-to-end"),
  section("subagent-delegation", "Subagent delegation", "Ủy thác subagent"),
  section("technical-decisions", "Technical decisions", "Quyết định kỹ thuật"),
  section("deviations-from-plan", "Deviations from plan", "Lệch so với plan"),
  section("completion-evidence", "Completion evidence", "Bằng chứng hoàn thành"),
  section("checklist", "Checklist"),
  section("human-actions-required", "Human actions required", "Việc cần người xử lý")
];

export const TRACEABILITY_SECTIONS = [section("linked-issues", "Linked Issues", "Issues liên quan"), section("ship-mode", "Ship Mode", "Chế độ ship")];

export function validatePrBody(body, { requireTraceability = true } = {}) {
  const text = typeof body === "string" ? body : "";
  const has = (s) => s.patterns.some((re) => re.test(text));
  const missingRequired = REQUIRED_SECTIONS.filter((s) => !has(s)).map((s) => s.id);
  const missingTraceability = TRACEABILITY_SECTIONS.filter((s) => !has(s)).map((s) => s.id);
  const findings = [
    ...missingRequired.map((id) => ({ severity: "Important", id, message: `Missing required PR body section: ${id}` })),
    ...(requireTraceability ? missingTraceability.map((id) => ({ severity: "Important", id, message: `Missing traceability section: ${id}` })) : [])
  ];
  return { ok: missingRequired.length === 0 && (!requireTraceability || missingTraceability.length === 0), missingRequired, missingTraceability, findings };
}

export default async function prBody(argv) {
  const [sub, ...rest] = argv;
  if (sub !== "check") {
    console.error("usage: mk pr-body check [--loose] (--file <path> | body on stdin)");
    return 2;
  }
  const i = rest.indexOf("--file");
  let body;
  if (i >= 0 && rest[i + 1]) body = fs.readFileSync(rest[i + 1], "utf8");
  else if (!process.stdin.isTTY) body = fs.readFileSync(0, "utf8");
  else {
    console.error("usage: mk pr-body check [--loose] (--file <path> | body on stdin)");
    return 2;
  }
  const r = validatePrBody(body, { requireTraceability: !rest.includes("--loose") });
  console.log(JSON.stringify(r, null, 2));
  return r.ok ? 0 : 1;
}
