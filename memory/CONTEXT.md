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
- `update --layout compact` migrates classic installs into `.agentik/` with collision checks.
- Root `pnpm verify` now runs real repo gates; adopter templates still get stub scripts during `build-template`.

## In progress

<Active specs and their status.>
- none

## Next steps

<Ordered, concrete.>
1. Bump CLI version for the compact-layout release.
2. Publish the next `create-agentik` version after release review.

## Open questions / blockers

- none

## Pointers

- Decisions: `memory/decisions/` · Patterns: `memory/conventions.md` ·
  Terms: `memory/glossary.md`
