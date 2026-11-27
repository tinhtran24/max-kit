import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { kb } from "../config.mjs";

export const STATES = ["draft", "reviewable", "active", "blocked", "passing", "retired"];
export const TRIGGERS = ["user_request", "ticket", "incident", "eval_finding", "source_review", "tooling_decision", "migration"];
export const LEVELS = ["contract", "structural", "dry_run", "boot", "endpoint", "golden_path", "e2e", "manual"];
export const RUN_RESULTS = ["passed", "failed", "blocked", "skipped"];
export const LOG_KINDS = ["ingest", "analyze", "synthesize", "decide", "incident", "harness", "fix", "feature", "compact", "tooling"];
export const LOG_HEADING = /^## \[(\d{4}-\d{2}-\d{2})\] ([a-z-]+) \| (.+)$/;

export const featuresDir = (cfg) => kb(cfg, "harness", "features");
export const runsDir = (cfg) => kb(cfg, "harness", "runs");
export const logDir = (cfg) => kb(cfg, "log");

const list = (dir, test) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(test).sort() : []);

export function frontMatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? YAML.parse(m[1]) : null;
}

export function loadFeatures(cfg) {
  const dir = featuresDir(cfg);
  return list(dir, (f) => f.endsWith(".yml")).map((name) => {
    const file = path.join(dir, name);
    try {
      return { file, name, data: YAML.parse(fs.readFileSync(file, "utf8")) };
    } catch (e) {
      return { file, name, data: null, error: e.message.split("\n")[0] };
    }
  });
}

export function loadRuns(cfg) {
  const dir = runsDir(cfg);
  return list(dir, (f) => f.endsWith(".md") && f !== "README.md").map((name) => {
    const file = path.join(dir, name);
    try {
      return { file, name, meta: frontMatter(fs.readFileSync(file, "utf8")) };
    } catch (e) {
      return { file, name, meta: null, error: e.message.split("\n")[0] };
    }
  });
}

export function parseLog(text) {
  const entries = [];
  let current = null;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const m = line.match(LOG_HEADING);
    if (m) {
      current = { date: m[1], kind: m[2], title: m[3], body: [] };
      entries.push(current);
    } else if (current) current.body.push(line);
  }
  for (const e of entries) e.body = e.body.join("\n").trim();
  return entries;
}
