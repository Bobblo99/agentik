# Spec: <task title>

- **Date:** YYYY-MM-DD
- **Status:** draft | approved | in progress | done
- **Related ADRs / memory:** <e.g. ADR-0003, conventions §state-management — or "none">

## Goal & scope

<2–4 sentences: what will exist after this task that doesn't now. One line on
what is explicitly OUT of scope.>

## Affected files / modules

<Verified list — every path below was listed/opened, not guessed. For new UI,
decide the folder layout up front (web profiles: folder-per-component, feature
vs. shared `components/` vs. `server/` — see rules/react-nextjs.md).>
- `path/to/file.ts` — <what changes>
- `path/to/new-file.ts` — NEW

## Plan

<Numbered, commit-sized steps. Check off during execution.>
- [ ] 1. <step>
- [ ] 2. <step>
- [ ] 3. <step>

## Test cases (designed BEFORE code)

| # | Test name (behavior) | Input / setup | Expected outcome |
|---|---|---|---|
| 1 | <does X when Y> | <…> | <…> |
| 2 | <edge case> | <…> | <…> |
| 3 | <failure case> | <…> | <…> |

## Acceptance criteria (all checkable)

- [ ] `pnpm verify` passes, including the test cases above
- [ ] <criterion — mechanically or visually verifiable>
- [ ] <criterion>

## Visual / UX acceptance (UI tasks only — delete otherwise)

- [ ] States rendered & checked: loading / empty / error / success
- [ ] Breakpoints checked: 375px / 768px / 1280px — no horizontal scroll
- [ ] Keyboard: full operability, visible focus
- [ ] <task-specific visual criterion, e.g. "table collapses to cards on mobile">

## Edge cases & risks

- <edge case and how the plan handles it>
- <risk + mitigation or "accepted because …">

## Open questions

- <UNVERIFIED/unknown items — resolve before or during execution, never by guessing>

## Deviations (filled during execution)

<Date — what changed vs. the plan and why.>

## Definition of Done

All acceptance criteria checked with evidence, `pnpm verify` green, memory
synced (AGENTS.md protocol), spec moved to `specs/archive/`.
