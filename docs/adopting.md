# Adopting the framework in a project

## New project (greenfield)

1. **Scaffold** with the CLI (recommended):
   `npm create agentik@latest my-app` — it prompts for a profile +
   name, copies the template, applies the profile (parking the rest), writes
   `framework.config.json`, and inits git. No-install alternative:
   `degit Bobblo99/agentik my-app`.
2. Open it with Claude Code (`claude`) or Codex.
3. Say **"init"** (Claude Code: `/init-foundation`). The agent makes the
   `pnpm verify` gates real and captures your business domain. (If you used
   `degit`, init also applies the profile, since the CLI didn't.)
4. First task: `/write-spec <task>` → approve → `/execute-spec specs/<file>`.

## Existing project

**One command (recommended):**

```bash
cd my-existing-app
npm create agentik@latest add   # auto-detects a profile from your deps
```

`add` copies only framework-owned files (it never touches your `package.json`
beyond ADDING missing gate scripts, and never touches `src/`/`README`/`LICENSE`),
brings the full config system, applies a profile, and is safe to re-run. Then
open with your agent and run `/init-foundation` to wire the real gate commands
and capture your domain.

**Manual alternative** (no CLI):

1. Copy these into the repo root: `AGENTS.md`, `CLAUDE.md`, `.claude/`,
   `rules/`, `.cursor/rules/`, `specs/`, `memory/`, `profiles/`, `scripts/`,
   `framework.config.json`, `.framework/`, `docs/`.
2. Add the scripts (`verify`, `typecheck`, `lint`, `test`, `check:framework`)
   to your existing package.json — point them at YOUR existing commands.
3. Run init: the interview maps the profile onto what already exists rather
   than imposing the default stack. Existing conventions get recorded into
   `memory/conventions.md` instead of being overwritten.

## Tool-specific notes

- **Claude Code**: reads CLAUDE.md → AGENTS.md automatically; skills are
  auto-discovered in `.claude/skills/`; slash commands in
  `.claude/commands/`; `.claude/settings.json` contains a Stop hook that
  runs `verify --quick` when JS/TS files changed — delete the hook if it's
  too strict for your flow, the AGENTS.md rule still applies.
- **Codex / other AGENTS.md tools**: read AGENTS.md natively. They have no
  slash commands — the workflow works identically because the commands are
  thin wrappers around skills that AGENTS.md already mandates.
- **Cursor**: `.cursor/rules/*.mdc` are thin pointers to `rules/` (single
  source of truth). If you edit a rule, edit it in `rules/`.

## Maintaining

- Treat rules/skills/AGENTS.md like code: change via PR, review the diff.
- Audit quarterly: stale instructions are worse than none.

### Personalizing & staying update-safe

The framework is meant to be personalized to your domain. Ownership is split so
you can pull framework updates without losing your work:

| Framework-owned (update may overwrite) | Project-owned (framework never touches) |
|---|---|
| `rules/*.md` (top level), `.cursor/rules/*.mdc` | `rules/custom/` + its `.cursor/rules/custom/` mirrors |
| `.claude/skills/<core>/`, `.claude/commands/` | your own `.claude/skills/<custom>/` |
| `profiles/`, `scripts/`, `AGENTS.md` skeleton | `memory/` (CONTEXT, domain, glossary, conventions, decisions), `specs/` |

Add domain rules with the **`customize`** skill (`/customize`): it writes to
`rules/custom/`, creates the cursor mirror, and keeps `pnpm check:framework`
green.

Update the framework later with a reviewable dry run:

```bash
npm create agentik@latest update -- --dry-run
npm create agentik@latest update
```

The command replaces changed framework-owned files, refreshes disabled modules
in their parked locations, and preserves `memory/`, `specs/`, custom rules,
custom skills, `framework.config.json`, package.json, README, LICENSE,
environment files, and application code. It does not delete files removed by a
new framework release and does not merge edits made directly to framework-owned
files; review the dry-run and Git diff before committing.

### Switching profiles & toggling modules

The active set of rules/skills lives in **`framework.config.json`**. Change it
with the **`configure`** skill — never by deleting files:

```
/configure switch-profile fullstack   # web-frontend → fullstack, losslessly
/configure disable api-route           # turn off one skill
/configure enable react-component      # turn it back on
/configure status                      # what's active right now
```

Disabling a module **parks** it in `.framework/disabled/` (agents never read
there) instead of deleting it, so nothing is lost and switching back is
instant. Locked-core modules (verification, security, validation, the spec/
test/review skills, …) can't be disabled. `pnpm check:framework` fails on any
drift between the config and the files.
- Keep AGENTS.md under ~150 lines and CONTEXT.md under 80 — push detail
  down into skills/rules/ADRs.
- Publishing as open source: this template contains no secrets by design
  (`.env`/`.mcp.json` are gitignored, examples are committed). MIT license
  included — put your name in LICENSE.
