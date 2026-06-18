---
name: architect
description: Make or review architecture decisions before broad implementation work. Use when a task changes module boundaries, data flow, persistence, API contracts, auth, multi-package structure, framework layout, dependency choices, or has unclear long-term tradeoffs.
---

# Architect

Architecture is the smallest durable structure that keeps the project easy to
change. This skill turns vague "build it" requests into explicit boundaries,
tradeoffs, and ADRs when the decision will matter later.

## Procedure

1. **Map the current system first.** Read `memory/CONTEXT.md`, relevant
   `memory/decisions/`, `memory/conventions.md`, and list the files/directories
   that define the area. Do not design against an imagined codebase.
2. **Name the decision.** State the architectural question in one sentence:
   "Where does validation live?", "Do we introduce a service layer?", "How do
   packages depend on each other?"
3. **Ask when constraints are missing.** If a decision depends on unknowns,
   ask 1-3 focused questions before designing. Good questions force a real
   tradeoff: "single tenant or multi tenant?", "optimize for first release or
   long-term plugin API?", "must this work offline?", "who owns this data?"
   Do not ask broad preference questions when the repository already answers
   them.
4. **Identify constraints.** Capture real constraints: existing API shape,
   deployment target, package manager, data ownership, security boundaries,
   team skill, migration cost, performance requirements.
5. **Define boundaries.** Specify which module owns which responsibility and
   which imports are allowed. Prefer one-way dependencies and narrow public
   APIs. If data crosses a boundary, name the DTO/schema/event shape.
6. **Compare options.** Evaluate 2-3 viable approaches with concrete tradeoffs.
   Reject options for project-specific reasons, not taste.
7. **Pick the boring default unless pressure exists.** Avoid new layers,
   libraries, queues, caches, or packages unless they remove real complexity or
   protect a boundary that is already under pressure.
8. **Plan migration.** For existing code, define safe steps: compatibility,
   backfill, deprecation, feature flag, or adapter. Avoid big-bang rewrites.
9. **Record durable decisions.** If the choice affects future tasks, create an
   ADR in `memory/decisions/` from `TEMPLATE.md`. If it is only task-local,
   write it in the spec's "Related ADRs / memory" and "Plan" sections.
10. **Hand off to implementation.** Produce a concrete file/module plan, test
   impact, and acceptance criteria. Then the relevant implementation skills
   (`api-route`, `db-migration`, `react-component`, etc.) can execute.

## Decision Checklist

- What owns the data?
- What validates the data at every boundary?
- What can import what?
- What must stay stable for callers?
- What is the rollback/migration path?
- What test proves the architecture contract?
- What future change should be easy after this decision?

## Anti-patterns

- Adding a "service layer" with no boundary pressure.
- Choosing a dependency because it is popular without verifying fit.
- Designing a future platform before one concrete use case exists.
- Letting UI components call persistence or auth code directly.
- Recording an ADR with vague consequences like "cleaner code".
