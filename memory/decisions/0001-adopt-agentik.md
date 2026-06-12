# ADR-0001: Adopt the Agentik framework

- **Date:** YYYY-MM-DD <!-- set by init-foundation -->
- **Status:** accepted

## Context

Agentic coding sessions lose context, drift from conventions, and hallucinate
APIs when project knowledge lives only in chat history. We need persistent
memory, a mandatory plan-before-code workflow, and machine-enforced quality
gates that work identically for Claude Code and Codex.

## Decision

Use Agentik: AGENTS.md as the single source of truth (CLAUDE.md
points to it), spec-driven workflow, file-based memory (CONTEXT/ADRs/
conventions/glossary), and `pnpm verify` as the hard Definition of Done.

- Active profile: <!-- set by init-foundation -->
- Deviations from profile defaults: none <!-- update if any -->

## Consequences

- Every non-trivial task starts with a spec in `specs/` and ends with a
  memory sync — no exceptions.
- Nothing is "done" with a red `pnpm verify`.
- Agents must verify files/packages/APIs before use (rules/00-verification.md).
- Maintenance duty: CONTEXT.md stays ≤ 80 lines; rules/skills are updated via
  PRs like code.

## Alternatives considered

- Chat-only context: rejected — does not survive sessions.
- Heavy SDD framework dependency: rejected — plain files keep both Claude
  and Codex first-class and the template stack-agnostic.
