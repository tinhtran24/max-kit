import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAdapters, renderTargets, validateAdapter, BUILT_IN } from "../src/adapters/registry.mjs";
import { syncKnowledgebase } from "../src/cli/sync.mjs";
import { editConfig, makeKb } from "./helpers.mjs";

const GOLDEN = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden");

const model = {
  project: "shop",
  root: "/kb",
  idPrefix: "SHOP",
  repos: [{ id: "api", path: "api", profile: "generic", testCommand: "npm test" }],
  branches: { protected: ["main"], deploy: ["production"] },
  readOrder: ["AGENTS.md", "knowledge/synthesis/agent-boot.md", "knowledge/harness/features-index.md"],
  teamRulesPath: "knowledge/synthesis/team-rules.md",
  teamRules: "# Team Rules\n\n## Done\n\nNo evidence means not done.",
  commands: [["npm run check", "Quality gate"]]
};

const byId = (id) => BUILT_IN.find((a) => a.id === id);

function golden(dir, files) {
  for (const f of files) {
    const file = path.join(GOLDEN, dir, f.path);
    if (process.env.UPDATE_GOLDEN) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, f.content);
    }
    assert.equal(f.content, fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"), `${dir}/${f.path} matches golden file`);
  }
}

test("claude target renders AGENTS.md without inline rules and CLAUDE.md import", () => {
  const { files, errors } = renderTargets(model, [byId("claude")]);
  assert.deepEqual(errors, []);
  assert.deepEqual(files.map((f) => f.path).sort(), ["AGENTS.md", "CLAUDE.md"]);
  golden("claude", files);
});

test("a target without session hooks inlines the team rules", () => {
  const { files } = renderTargets(model, [byId("claude"), byId("agents-md")]);
  const agents = files.find((f) => f.path === "AGENTS.md").content;
  assert.match(agents, /No evidence means not done\./);
  golden("agents-md", files.filter((f) => f.path === "AGENTS.md"));
});

test("built-in adapters satisfy the contract", () => {
  for (const a of BUILT_IN) assert.deepEqual(validateAdapter(a, a.id), []);
});

test("invalid adapters are reported", () => {
  assert.ok(validateAdapter({ id: "Bad Id", capabilities: { hooks: ["session"] } }, "x").length >= 3);
});

test("conflicting renders of the same file are errors", () => {
  const a = { id: "a", capabilities: { instructions: "none", hooks: [] }, render: () => [{ path: "X.md", content: "1" }] };
  const b = { id: "b", capabilities: { instructions: "none", hooks: [] }, render: () => [{ path: "X.md", content: "2" }] };
  assert.match(renderTargets(model, [a, b]).errors[0], /X\.md: rendered differently by a and b/);
});

test("an external adapter from the config is discovered and rendered", async () => {
  const kb = await makeKb();
  fs.mkdirSync(path.join(kb, "adapters"), { recursive: true });
  fs.writeFileSync(
    path.join(kb, "adapters", "rules-file.mjs"),
    `export default {
  id: "rules-file",
  displayName: "Example rules-file runtime",
  capabilities: { instructions: "native", skills: "none", agents: "none", hooks: [], plugin: "none", blocking: "none" },
  render(model) { return [{ path: ".example/rules.md", content: "# " + model.project + "\\n\\nRead AGENTS.md first.\\n" }]; }
};
`
  );
  const cfg = editConfig(kb, (c) => {
    c.adapters = ["./adapters/rules-file.mjs"];
    c.targets = ["claude", "rules-file"];
  });
  const { adapters, problems } = await loadAdapters(cfg);
  assert.deepEqual(problems, []);
  assert.equal(adapters.get("rules-file").source, "./adapters/rules-file.mjs");
  const r = await syncKnowledgebase(cfg);
  assert.deepEqual(r.errors, []);
  assert.equal(fs.readFileSync(path.join(kb, ".example/rules.md"), "utf8"), "# shop\n\nRead AGENTS.md first.\n");
  assert.match(fs.readFileSync(path.join(kb, "AGENTS.md"), "utf8"), /## Team rules\n[\s\S]*### Safety: stop and ask first/);
});

test("unknown targets and broken adapters are reported, not thrown", async () => {
  const kb = await makeKb();
  const cfg = editConfig(kb, (c) => {
    c.adapters = ["./missing.mjs"];
    c.targets = ["claude", "nope"];
  });
  const r = await syncKnowledgebase(cfg, { check: true });
  assert.ok(r.errors.some((e) => /missing\.mjs: cannot load/.test(e)));
  assert.ok(r.errors.some((e) => /unknown target "nope"/.test(e)));
});
