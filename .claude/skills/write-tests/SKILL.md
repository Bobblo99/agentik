---
name: write-tests
description: Write or extend automated tests. Use whenever new logic is implemented, a bug is fixed (regression test first), or the user mentions tests, coverage, vitest, jest, or testing library. Implements the test cases designed in the task's spec.
---

# Write Tests

Tests encode the spec's test cases. New logic without tests is not done.

## Procedure

1. **Source of truth**: the "Test cases" section of the active spec. If no
   spec exists (trivial task), derive cases from the change: happy path,
   one edge case, one failure case — minimum.
2. **Verify the harness**: check `package.json` for the actual test runner
   and existing test file conventions (`*.test.ts` location, helpers) before
   writing. Match the project's existing style.
3. **Test behavior, not implementation**: assert on outputs/effects, not on
   internal calls. Don't test framework code or trivial getters.
4. **Structure**: Arrange–Act–Assert, one behavior per test, name =
   "does X when Y" (readable as a sentence).
5. **React components** (when RTL is active): query by role/label like a
   user would; never by class or test-internal structure unless unavoidable
   (`data-testid` is the last resort). Cover all UI states defined in the
   spec: loading, empty, error, success.
6. **Bug fixes**: write the failing regression test FIRST, then fix.
7. Run `pnpm test` and show the result. Flaky test → fix the flake now,
   don't retry-until-green.

## Anti-patterns

- Tests that mirror the implementation line by line (refactor-hostile).
- Mocking the unit under test.
- Snapshot tests as a substitute for assertions.
- Skipped/`.only` tests left in the code.
