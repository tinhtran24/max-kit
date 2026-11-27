import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const has = (dir, ...p) => fs.existsSync(path.join(dir, ...p));
const read = (dir, ...p) => {
  try {
    return fs.readFileSync(path.join(dir, ...p), "utf8");
  } catch {
    return "";
  }
};
const json = (dir, file) => {
  try {
    return JSON.parse(read(dir, file));
  } catch {
    return null;
  }
};

function packageRunner(dir) {
  if (has(dir, "pnpm-lock.yaml")) return { run: "pnpm", exec: "pnpm exec" };
  if (has(dir, "yarn.lock")) return { run: "yarn", exec: "yarn" };
  if (has(dir, "bun.lockb") || has(dir, "bun.lock")) return { run: "bun run", exec: "bunx" };
  return { run: "npm run", exec: "npx" };
}

function dbmate(dir) {
  const files = ["Makefile", "Dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml", "package.json", "composer.json", "Gemfile"];
  return files.some((f) => /\bdbmate\b/.test(read(dir, f)));
}

const DETECTORS = [
  {
    profile: "rails",
    match: (dir) => has(dir, "Gemfile") && /\brails\b/.test(read(dir, "Gemfile")) && has(dir, "config", "application.rb"),
    fill(dir, out) {
      out.testCommand = has(dir, "spec") && /\brspec\b/.test(read(dir, "Gemfile")) ? "bundle exec rspec" : "bin/rails test";
      out.migrationGenerator = "bin/rails generate migration <Name>";
      out.signals.push("Gemfile with rails", "config/application.rb");
    }
  },
  {
    profile: "laravel",
    match: (dir) => /"laravel\/framework"/.test(read(dir, "composer.json")) || (has(dir, "artisan") && has(dir, "composer.json")),
    fill(dir, out) {
      const composer = json(dir, "composer.json");
      out.testCommand = composer?.["require-dev"]?.["pestphp/pest"] ? "./vendor/bin/pest" : "php artisan test";
      out.migrationGenerator = "php artisan make:migration <name>";
      out.signals.push("composer.json with laravel/framework");
    }
  },
  {
    profile: "django",
    match: (dir) => has(dir, "manage.py") || /\bdjango\b/i.test(read(dir, "requirements.txt") + read(dir, "pyproject.toml") + read(dir, "Pipfile")),
    fill(dir, out) {
      const py = read(dir, "pyproject.toml") + read(dir, "requirements.txt") + read(dir, "requirements-dev.txt");
      out.testCommand = has(dir, "pytest.ini") || has(dir, "conftest.py") || /\bpytest\b/.test(py) ? "pytest" : "python manage.py test";
      out.migrationGenerator = "python manage.py makemigrations <app> --name <name>";
      out.signals.push(has(dir, "manage.py") ? "manage.py" : "django dependency");
    }
  },
  {
    profile: "go",
    match: (dir) => has(dir, "go.mod"),
    fill(dir, out) {
      const mod = read(dir, "go.mod");
      out.testCommand = "go test ./...";
      const migDir = has(dir, "db", "migrations") ? "db/migrations" : "migrations";
      if (/pressly\/goose/.test(mod)) out.migrationGenerator = `goose -dir ${migDir} create <name> sql`;
      else if (/golang-migrate\/migrate/.test(mod)) out.migrationGenerator = `migrate create -ext sql -dir ${migDir} -seq <name>`;
      else if (/ariga\.io\/atlas/.test(mod)) out.migrationGenerator = "atlas migrate diff <name>";
      out.signals.push("go.mod");
    }
  },
  {
    profile: "node",
    match: (dir) => has(dir, "package.json"),
    fill(dir, out) {
      const pkg = json(dir, "package.json") || {};
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const { run, exec } = packageRunner(dir);
      out.testCommand = pkg.scripts?.test && !/no test specified/.test(pkg.scripts.test) ? (run === "npm run" ? "npm test" : `${run} test`) : "";
      if (deps.prisma || deps["@prisma/client"]) out.migrationGenerator = `${exec} prisma migrate dev --create-only --name <name>`;
      else if (deps["drizzle-kit"]) out.migrationGenerator = `${exec} drizzle-kit generate --name <name>`;
      else if (deps.knex) out.migrationGenerator = `${exec} knex migrate:make <name>`;
      else if (deps["sequelize-cli"]) out.migrationGenerator = `${exec} sequelize-cli migration:generate --name <name>`;
      else if (deps.typeorm) out.migrationGenerator = `${exec} typeorm migration:create src/migrations/<Name>`;
      out.signals.push("package.json");
    }
  }
];

export function composeService(dir) {
  for (const file of ["compose.yml", "compose.yaml", "docker-compose.yml", "docker-compose.yaml"]) {
    const text = read(dir, file);
    if (!text) continue;
    let doc;
    try {
      doc = YAML.parse(text);
    } catch {
      continue;
    }
    const services = Object.entries(doc?.services || {});
    const mountsRepo = ([, s]) => (s?.volumes || []).some((v) => /^\.{1,2}(\/[^:]*)?:/.test(typeof v === "string" ? v : `${v?.source}:`));
    const buildsRepo = ([, s]) => s?.build === "." || s?.build?.context === ".";
    const pick = services.find(mountsRepo) || services.find(buildsRepo);
    if (pick) return { service: pick[0], container: pick[1]?.container_name || "", file };
  }
  return null;
}

export function detectRepo(dir) {
  const out = { profile: "generic", testCommand: "", migrationGenerator: "", container: "", signals: [] };
  const hit = DETECTORS.find((d) => d.match(dir));
  if (hit) {
    out.profile = hit.profile;
    hit.fill(dir, out);
  }
  if (dbmate(dir) && (has(dir, "db", "migrations") || !out.migrationGenerator)) {
    out.migrationGenerator = "dbmate new <name>";
    out.signals.push("dbmate");
  }
  const svc = composeService(dir);
  if (svc) {
    out.container = svc.container || svc.service;
    out.signals.push(`${svc.file} service ${svc.service}`);
  }
  return out;
}

export function findRepos(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !["knowledge", "node_modules"].includes(e.name))
    .filter((e) => has(root, e.name, ".git"))
    .map((e) => e.name)
    .sort();
}

export function detectAll(cfg) {
  const configured = new Map(cfg.raw.repos?.map((r) => [r.path, r]) || []);
  const paths = [...new Set([...configured.keys(), ...findRepos(cfg.root)])];
  return paths.map((p) => {
    const dir = path.join(cfg.root, p);
    const existing = configured.get(p);
    const found = fs.existsSync(dir) ? detectRepo(dir) : null;
    return { path: p, id: existing?.id || p.split("/").pop().toLowerCase().replace(/[^a-z0-9-]/g, "-"), existing, found };
  });
}

const FIELDS = ["profile", "testCommand", "migrationGenerator", "container"];

export function mergeDetected(raw, detected) {
  const repos = [...(raw.repos || [])];
  const changes = [];
  for (const d of detected) {
    if (!d.found) continue;
    let repo = repos.find((r) => r.path === d.path);
    if (!repo) {
      repo = { id: d.id, path: d.path };
      repos.push(repo);
      changes.push(`add repo ${d.id} (${d.path})`);
    }
    for (const f of FIELDS) {
      const value = d.found[f];
      if (value && !repo[f] && !(f === "profile" && value === "generic")) {
        repo[f] = value;
        changes.push(`${repo.id}.${f} = ${value}`);
      }
    }
  }
  const next = { ...raw, repos };
  const profiles = [...new Set(repos.map((r) => r.profile).filter(Boolean))];
  if ((!raw.profile || raw.profile === "generic") && profiles.length === 1) {
    next.profile = profiles[0];
    changes.push(`profile = ${profiles[0]}`);
  }
  return { config: next, changes };
}
