---
name: mk-vault
description: "Store, find, rotate and use secrets (API keys, tokens, .env values) through the max-kit vault (`mk secrets`) without ever printing a value, while honouring a recorded choice of .env files or another secret manager. Use when a task touches a credential, a .env.* file, or a deploy or API call that needs a key."
when_to_use: "Invoke when a task stores, finds, rotates, imports or uses a credential, or meets .env.* files. Read the recorded secret-store choice first and ask at most once."
category: workflow
keywords: [secrets, vault, credentials, api-key, token, dotenv, env-file, local-vault, rotate, import-env]
argument-hint: "[store|find|use|rotate|import] [ref or .env path]"
metadata:
  author: max-kit
  version: "2.0.0"
---

# max-kit vault

Handle credentials the way the user chose, with no value ever entering the conversation. `mk secrets` is the recommended store, not a mandatory one: a user who keeps `.env.*` files or runs another secret manager is followed, never pushed. Ask only when a decision is genuinely missing, and record the answer so it is never asked again.

The vault is local to this machine: values are encrypted with AES-256-GCM and the key lives in the OS keychain (macOS Keychain, Secret Service on Linux, DPAPI on Windows; a 0600 key file otherwise). `mk secrets status` shows the backend.

## Hard rules

- Never print, echo, log or paste a secret value. Report refs, counts, exit codes and `[redacted]` only. Never ask a person to paste a value into the conversation.
- Feed values only through stdin (`--value=-`) or a file (`--value-file`), from a script that reads the source and pipes it on. `--value=<literal>` is refused (exit 2): it would land in shell history.
- Do not read a `.env*` file to see what it contains; the max-kit guard blocks it. Use `mk secrets import-env`, or a non-echoing script that moves one value the user asked to move.
- Never `--force` over an existing ref whose source of truth is unclear. Check first; ask when the stored value and the new one could disagree.
- `mk secrets get --reveal` is for a person at a terminal; it refuses under an agent (exit 6). Confirm a write by exit code, `get` (prints `[redacted]`), `search` or `list --json`.
- To tell whether a ref holds the expected credential, read its `hint` (a public prefix and the last 4 characters, or `null` with `hintReason: short value`) from `get --json`, then confirm with `mk secrets compare <REF> --value=-` from a non-echoing script. It answers `match` or `differs`, refuses values under 16 characters after the prefix (exit 2), and every call is audited, so never loop it to guess a value.
- Approval commands (`mk secrets approve`) belong to the user in their own terminal. Do not run them through the agent, a hook or a wrapper; they refuse (exit 6).

## Step 1: Read the recorded choice

```bash
mk secrets store --json     # {"choice": "mk-vault" | "env-file" | "external:<name>" | null, "scope": ...}
```

| Choice | What to do |
| --- | --- |
| `mk-vault` | Use `mk secrets` (steps 2 to 4). |
| `env-file` | Work with the project's `.env.*` files as asked, through scripts that never print values. Do not suggest the vault. Warn once, without blocking, if `git check-ignore -q <file>` says a secrets file is not ignored. |
| `external:<name>` | Use that manager's own documented workflow. Do not suggest the vault. |
| `null` | Recommend once (below), then follow the answer. |

**Recommend once.** Only while the task involves a credential or a `.env.*` file, and only in an interactive session, ask one question: store secrets in the max-kit vault (recommended: encrypted, searchable, values injected without printing), keep `.env.*` files, or use another manager (name it). Ask whether the answer covers this project or every project, then record it:

```bash
mk secrets store mk-vault --scope project     # or --scope user; env-file; external:1password
```

A user who brushes the question off has still answered: record what the project already does (`env-file` when it keeps `.env.*` files). In CI or any non-interactive run, never ask; continue with what the project uses.

## Step 2: Settle the metadata before writing

Every ref needs a project and an environment so it can be found later. Infer them from evidence:

- environment from the file name (`.env.production` is `production`) or the deploy target;
- project from the repository (`git remote get-url origin` basename, else the directory name);
- provider from the variable prefix (`CLOUDFLARE_*` is `cloudflare`), account only when the source states it.

When project or environment is still ambiguous (a bare `.env`, a monorepo, a key shared by several projects), ask one question before writing, offering the inferred candidates. In a non-interactive run, stop without writing and name the missing fields.

Name refs `<PROJECT>_<NAME>` for a project secret (add `_<ENV>` when the project keeps more than one environment of it) and the provider's conventional name (`CLOUDFLARE_API_TOKEN`) for a credential shared across projects.

## Step 3: Find, then store

```bash
mk secrets search stripe --json
mk secrets search --project shop --environment production --json
mk secrets list --json
```

An existing ref for the same purpose is updated with `mk secrets rotate` (value) or `mk secrets annotate` (metadata), never re-created. To store one value from a `.env` file, write this script with the file-editing tools and run it, so the value never appears in a command:

```bash
#!/usr/bin/env bash
# store-one.sh <env-file> <VAR> <REF> : moves one value without printing it
set -euo pipefail
value="$(grep -E "^$2=" "$1" | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
[ -n "$value" ] || { echo "missing: $2" >&2; exit 3; }
printf '%s' "$value" | mk secrets set "$3" --value=- \
  --description "<what it is for>" --project <project> --environment <env> --provider <provider>
echo "stored: $3"
```

Profile flags: `--description`, `--project`, `--environment`, `--provider`, `--account`, `--tag` (repeat), `--rotate-ttl 90d`. `set` exits 4 when the ref exists.

A value the user wants to type themselves: give them `mk secrets set <REF>` with the profile flags; it prompts without echo in their terminal.

Whole files:

```bash
mk secrets import-env <dir|file> --project <project> --dry-run --json   # show counts, not values
mk secrets import-env <dir|file> --project <project>
```

`import-env` takes the environment from the file suffix, skips example, sample, template and backup files, leaves existing refs alone unless `--force`, and never edits or deletes the source file. Moving the app to read from the vault and removing the file are the user's decisions.

## Step 4: Use, rotate, delete

**Use** a secret by injecting it into one program; its output is scanned and every injected value is replaced with `[redacted:<REF>]`:

```bash
mk secrets run --env STRIPE_API_KEY=SHOP_STRIPE_KEY --purpose "balance check" -- node scripts/check-balance.mjs
mk secrets run -- curl -s -H 'Authorization: Bearer ${secret:SHOP_STRIPE_KEY}' https://api.stripe.com/v1/balance
```

`${secret:REF}` is replaced only inside `mk secrets run` arguments. Write it with the file-editing tools when it belongs in a script; never put it in commit messages or other text.

**Approvals.** Under an agent, each scope (ref, program, variable) needs a user grant. The first run exits 7 and files a request. For a job with several steps, file every scope first, the same way the job will run them:

```bash
mk secrets request SHOP_STRIPE_KEY --exec node --env STRIPE_API_KEY --purpose "balance check"
```

Then ask the user to run `mk secrets approve` in their own terminal, with the default 24h window rather than `--once`, so later steps do not block again; explain why. They can inspect with `mk secrets grants` and remove with `mk secrets revoke <REF>` or `--all`.

**Rotate** at the provider first, store the new value with `mk secrets rotate <REF> --value=-` from a script, then revoke the old credential at the provider. Report each step's outcome, never the value. After a suspected leak: the user runs `mk secrets revoke --all`, rotate at the provider and in the vault, then `mk secrets audit --secret <REF> --json` shows who used it.

**Delete** is permanent: confirm with the user, then `mk secrets delete <REF> --yes`.

**Audit and inventory:** `mk secrets audit [--secret REF] [--decision pending|allow|deny] [--since 24h] --json`, `mk secrets export --json` (metadata only), `mk secrets status`.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | done (for `run`, the program's own exit code is passed through) |
| 2 | usage error or refused input (literal value, short compare, delete without `--yes`) |
| 3 | no value supplied |
| 4 | ref already exists |
| 5 | ref not found, or the vault key is missing on this machine |
| 6 | must be run by the user in their own terminal |
| 7 | waiting for the user's approval |

## Not available yet

Cross-device sync, vault recovery kits and shared vault members are not part of the local vault. When a task needs them, say so and suggest the project's own secret manager for shared credentials.
