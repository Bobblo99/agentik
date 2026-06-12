# DEVELOPMENT — handoff notes (not shipped to adopters)

> Dev-facing state of the **framework itself**. Any AGENTS.md tool (Codex,
> Cursor, Claude Code) can read this to continue the work. Excluded from the
> CLI's published template snapshot — adopters never see it.
> The in-repo `memory/` is intentionally placeholder state (it's shipped
> payload); the real dev roadmap lives here.

## What this repo is

`Agentik` = a framework template for agentic coding **plus** a CLI
(`cli/`, published as `create-agentik`) that scaffolds it into new or
existing projects. The repo root IS the template; `cli/` bundles a cleaned copy.

## Continue in Codex (or any AGENTS.md tool)

- **AGENTS.md is read natively** — the rules, workflow, and memory protocol all
  apply. Start there.
- **Skills/slash-commands are Claude Code-specific.** Codex has no `/configure`,
  `/customize`, `/init-foundation`. They are thin wrappers — to use one, tell
  the agent: *"read `.claude/skills/<name>/SKILL.md` and follow it."* Same
  outcome (see `docs/adopting.md` → Tool-specific notes).
- **Quality gates (run these):**
  - `pnpm check:framework` — framework integrity (mirror parity, config↔fs, budgets)
  - `cd cli && npm install && npm run check && npm test` — CLI typecheck/lint/format + 21 tests

## Current state (2026-06)

- Framework: core rules incl. `security`, `validation` (zod v4); reversible
  config system (`framework.config.json` + `configure` skill + `.framework/disabled/`);
  personalization (`rules/custom/`, `memory/domain.md`, `customize` skill);
  React 19 / a11y rules; CI (`.github/workflows/`).
- CLI: greenfield scaffold + `add` (existing projects) with smart detection
  (profile/package-manager/gates), and ownership-aware `update` for adopted
  projects. Both mutation flows support `--dry-run` and dirty-tree warnings.
  Dogfooded (tsc checkJs + eslint + prettier). Cross-platform (CI matrix
  ubuntu+windows × node 18/20/22).

## Next up (chosen, not yet built)

1. **Broader detection/profiles** — monorepo/workspaces, Next App-vs-Pages,
   non-JS stacks (Python→ruff/mypy/pytest, Rust→clippy/cargo). Extend
   `cli/lib/detect.js` + add profiles.
2. Deferred robustness: transactional `add`/`update` (stage-then-move),
   config-schema migrations, greenfield wiring
   real gates.

## Release checklist

Push verified `main` → record `demo.gif` (`vhs cli/demo.tape`) → confirm npm
ownership/name availability → `cd cli && npm publish`.

## Working agreement

Follow `AGENTS.md`: spec before non-trivial work (`specs/`), keep gates green,
finished specs → `specs/archive/`. Framework-dev history goes in git/CHANGELOG,
not into the shipped `memory/`.
