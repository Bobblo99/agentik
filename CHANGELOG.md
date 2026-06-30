# Changelog

All notable changes to this framework template are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project aims to follow [Semantic Versioning](https://semver.org/).

> This is the **framework's** changelog. After adopting the template, replace
> it with your project's own.

## [Unreleased]

### Added
- Installed project commands: scaffold/add now add `create-agentik` as a
  devDependency and wire `agentik`, `agentik:update`, and `agentik:check`
  scripts without overwriting existing scripts. The package also exposes an
  `agentik` bin alias and a `check` subcommand.
- **Compact layout**: new CLI installs can keep framework internals under
  `.agentik/` while leaving only small root bridge files (`AGENTS.md`,
  `CLAUDE.md`) for agent discovery. `--layout classic` remains available for
  the old expanded layout.
- **Classic → compact migration**: `npm create agentik@latest update -- --layout compact`
  moves existing classic installs into `.agentik/` with collision checks before
  moving files, preserving project memory, specs, custom rules/skills, package
  scripts, config, and application code.
- Clean compact roots: Agentik-owned README, German README, changelog,
  contributing guide, and license now live under `.agentik/` for compact
  scaffolds. Classic-to-compact migration moves those files only when they still
  match the bundled Agentik template, so user-owned project docs stay in root.
- Agent-neutral compact skills: compact installs now expose canonical skills at
  `.agentik/skills/` for Codex, Cursor, Claude, and other agents, while keeping
  `.agentik/claude/skills/` as a Claude compatibility mirror.
- `react-quality` skill: React/Next.js TypeScript guidance for discriminated
  unions, `as const` data, literal unions over enums, derived types, component
  API design, and avoiding weak casts/boolean state explosions.
- **`update` command** (`npm create agentik update`): refreshes
  framework-owned rules, core skills, commands, profiles, scripts, and docs in
  an adopted project while preserving memory, specs, custom rules/skills,
  configuration, package metadata, and application code. Supports `--dry-run`,
  keeps disabled modules parked, preserves the package-manager runner, and
  warns on dirty Git worktrees.
- **`create-agentik` CLI** (`npm create agentik`): interactive
  scaffolder (`@clack/prompts`) with a dependency-free, scriptable core
  (`--profile --name --no-git --yes`). Copies a clean template snapshot, applies
  the profile by parking the rest, writes the config, and inits git. Lives in
  `cli/`; ships a cleaned template via a `prepack` build step.
- **`add` mode** (`npm create agentik add`): drop the framework into an
  EXISTING project. Copies only framework-owned files (never `package.json`
  beyond adding missing gate scripts, never `src/`/`README`/`LICENSE`), brings
  the full config system, and is safe to re-run (skips existing files).
- **Smart detection**: `add` inspects the project and proposes a setup —
  profile (Next/React/API/ORM-aware), package manager (from the lockfile),
  TypeScript, and **real gate commands** (`tsc`/`eslint`/`vitest`/`jest`) — shows
  it with reasons, and lets you confirm or override. It wires the detected gate
  scripts and adapts `verify.sh` to your package manager, so `/init-foundation`
  has less to do.
- **Broader detection**: identifies language (Node/Python/Rust/Go), monorepo
  tool (pnpm-workspaces/turbo/lerna/nx/npm), and Next router style; non-JS
  projects map to the generic profile with stack-correct gate proposals
  (Python ruff/mypy/pytest, Rust/Go toolchains) surfaced for wiring.
- CLI production hardening: `--version`, `--dry-run` (preview `add` changes
  without writing), a dirty-working-tree warning before `add`, a Node `>=18`
  guard, npm metadata + `cli/LICENSE`, README badges + positioning, a `vhs`
  demo tape, and a CI matrix (ubuntu+windows × node 18/20/22) running the CLI
  tests. Fixed a Windows path bug in the scaffolder; test files no longer ship
  in the npm package.
- CLI dogfooding + robustness: the CLI now type-checks itself (`tsc --checkJs`),
  lints (ESLint) and formats (Prettier) via `npm run check` (in CI); preserves a
  user's `package.json` indentation on `add`; and has automated CLI-entry tests
  (version/help/scaffold/dry-run).
- Configuration system: `framework.config.json` (active rules/skills + profile),
  the `configure` skill + `/configure` command (status / enable / disable /
  switch-profile), and a `.framework/disabled/` parking area so disabling is
  reversible and profile switching is lossless. init-foundation now parks
  unused modules instead of deleting them; `check-framework` enforces
  config ↔ filesystem consistency and locked-core integrity.
- Core rule `rules/validation.md` — schema-first boundary validation, zod v3/v4.
- Core rule `rules/security.md` — server-side authz, XSS/injection, secrets,
  dependency hygiene, headers.
- Shipped configs as web-frontend profile assets (`tsconfig.base.json` with
  `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, flat
  `eslint.config.mjs`, Prettier, EditorConfig).
- Adopter CI workflow asset (`verify.yml`) — runs `pnpm verify` + audit on PRs.
- Framework-integrity CI for this repo: `scripts/check-framework.sh`,
  `.github/workflows/ci.yml`, `pnpm check:framework` (mirror parity, rule
  wiring, line budgets).
- Personalization: `rules/custom/` (project-owned rules), `memory/domain.md`
  (durable business context), and the `customize` skill + command.
- React 19 patterns in `rules/react-nextjs.md` (Actions, `useActionState`,
  `useOptimistic`, `use()`, Suspense/error boundaries).
- a11y: `prefers-reduced-motion` + `aria-live` in `rules/ui-ux.md`; jest-axe /
  axe-playwright enforcement in `rules/testing.md`.
- Release hygiene: `CONTRIBUTING.md`, this changelog, package metadata.

### Fixed
- Greenfield `scaffold` now writes a **plain** `package.json` (project name as an
  npm slug, `version`, `private`, scripts) instead of copying Agentik's own
  identity. New projects no longer inherit the framework author, repository URL,
  description, or keywords. Scaffolding with `--force` into a directory that
  already has a `package.json` preserves it and only merges in missing scripts.

### Changed
- Renamed the product to **Agentik**, the npm package to `create-agentik`, and
  the canonical repository to `Bobblo99/agentik`.
- `rules/typescript.md` aligned with the shipped tsconfig (`satisfies`, branded
  IDs, extra strict flags).
- `init-foundation` skill captures the business domain and copies profile assets.
- `package.json` is no longer `private`; added `license`, `keywords`.

## [1.0.0] — 2026

### Added
- Initial template: AGENTS.md single source of truth, memory-as-files, spec
  workflow, enforced `pnpm verify` gate, core rules/skills, profiles
  (web-frontend / fullstack / generic), Cursor mirrors.
