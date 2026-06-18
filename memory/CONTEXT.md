# Project Context

> **Memory type: working** (now-state; MemGPT "main context"). See `docs/memory-model.md`.
>
> Living document. HARD BUDGET: 80 lines. On every update: delete completed
> items, move decisions → ADRs, move patterns → conventions.md. This is a
> snapshot of NOW, not a log.
> Last updated: 2026-06-18 (by Codex)

## What this project is

<1–2 sentences — filled by init-foundation.>

## Current state

- Agentik CLI supports compact layout via `--layout compact` and new CLI installs default to compact.
- Compact layout keeps root `AGENTS.md`/`CLAUDE.md` as bridge files and moves framework internals under `.agentik/`.
- Compact scaffolds now keep Agentik README, changelog, contributing guide, and license under `.agentik/` instead of the project root.
- `update --layout compact` migrates classic installs into `.agentik/` with collision checks.
- `react-quality` skill ships for React/fullstack profiles; generic profile parks it.
- Compact installs expose canonical skills at `.agentik/skills/` for all agents and keep `.agentik/claude/skills/` as a Claude compatibility mirror.
- Scaffold/add now install `create-agentik` as a devDependency and add `agentik`, `agentik:update`, and `agentik:check` scripts when a package.json exists.
- Root `pnpm verify` now runs real repo gates; adopter templates still get stub scripts during `build-template`.

## In progress

<Active specs and their status.>
- none

## Next steps

<Ordered, concrete.>
1. Commit and push the installed-command UX changes.
2. Bump/publish the next `create-agentik` version after release review.

## Open questions / blockers

- none

## Pointers

- Decisions: `memory/decisions/` · Patterns: `memory/conventions.md` ·
  Terms: `memory/glossary.md`
