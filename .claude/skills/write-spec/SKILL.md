---
name: write-spec
description: Write a specification BEFORE implementing any non-trivial task (touches more than one file, adds new logic, or takes over ~15 minutes). Use whenever the user asks to build, add, change, refactor or fix something substantial — even if they don't say "spec". This is the mandatory first step of the core workflow in AGENTS.md.
---

# Write Spec

Plan before code. The spec is a working document the executor checks off,
not bureaucracy. Test cases are designed HERE, before any code exists.

## Procedure

1. **Read memory first**: `memory/CONTEXT.md`, then scan
   `memory/conventions.md` and `memory/decisions/` for relevant entries.
   Reference relevant ADRs in the spec ("per ADR-0003 we use X").
2. **Verify the territory**: list the directories and open the files you
   plan to touch. Never write "modify `src/lib/api.ts`" without confirming
   that file exists. Unknowns go into "Open questions", not into guesses.
3. **Create** `specs/YYYY-MM-DD-<short-slug>.md` from `specs/TEMPLATE.md`.
   Fill EVERY section. Today's real date.
4. **Write checkable acceptance criteria** — each one must be mechanically
   or visually verifiable:
   - GOOD: "`pnpm test` passes incl. 3 new tests for `parseInvoice`",
     "empty state renders when list is empty", "works at 375px width".
   - BAD: "code is clean", "good UX", "performant".
5. **Design test cases now**: for each behavior, name the test, the input,
   the expected outcome — including at least one edge case and one failure
   case. The `write-tests` skill will implement exactly these.
6. **UI tasks**: fill the "Visual / UX acceptance" section (states:
   loading/empty/error/success; breakpoints; keyboard/a11y check).
7. **Stop.** Present the spec summary in chat. For large or ambiguous tasks,
   wait for user approval before executing. Small clear tasks: state that
   you'll proceed and continue with `execute-spec`.

## Anti-patterns

- Writing the spec after the code (it's a plan, not a changelog).
- Vague criteria that can't fail.
- A spec that lists files you never verified exist.
- Skipping edge/failure test cases.
