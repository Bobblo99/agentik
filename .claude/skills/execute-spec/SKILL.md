---
name: execute-spec
description: Implement an approved spec file from specs/. Use whenever implementation work starts on a task that has a spec, or the user says "execute", "implement the spec", "go ahead", "ok build it". Works the plan step by step, keeps the spec updated, and finishes with verify + acceptance check + memory sync.
---

# Execute Spec

The spec is the plan of record. You work it; you don't improvise around it.

## Procedure

1. **Load**: read the spec file fully. Re-read `rules/00-verification.md`.
2. **Work the steps in order.** After completing each numbered step, edit
   the spec file: `- [ ]` → `- [x]`. Commit-sized progress, not one big bang.
3. **Test-first where the spec defines test cases**: write the test (per
   `write-tests` skill), watch it fail, implement, watch it pass.
4. **Deviations**: if reality contradicts the plan (file doesn't exist as
   assumed, better approach found, scope creep detected) — STOP, update the
   spec first (change steps, note the reason under "Deviations"), then
   continue. Significant scope changes: tell the user before proceeding.
5. **Iterate with** `pnpm verify --quick`; finish only with full
   `pnpm verify` green.
6. **Acceptance walk**: go through every acceptance criterion in the spec
   and check it off with evidence (test name, command output, or — for UI —
   the completed visual check). Anything unmet → the task is not done.
7. **Close out**: run the memory protocol (AGENTS.md), then move the spec
   to `specs/archive/`. Report: what shipped, what deviated and why,
   verify status.

## Anti-patterns

- Coding ahead of the spec "because it's obvious".
- Checking off steps you didn't actually complete.
- Declaring done with failing/skipped gates ("tests are red but unrelated"
  → then fix them or escalate per AGENTS.md "When stuck").
- Silent scope creep.
