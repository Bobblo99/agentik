# Rule — Testing

- **Test cases are designed in the spec, before code exists.** Implementation
  follows them (see write-tests skill).
- Default stack: Vitest + React Testing Library; Playwright for E2E where the
  profile enables it. Always check `package.json` for what is actually set up.
- A task with new logic is done only when its spec'd test cases run green in
  `pnpm verify`. "Tests later" does not exist.
- Minimum per new behavior: happy path + one edge case + one failure case.
- Bug fix = regression test first (red), then fix (green).
- Test behavior through public interfaces; refactors must not break tests
  that don't touch behavior.
- Component tests query by role/label; `data-testid` is the last resort.
- Data-driven components carry an automated a11y assertion (jest-axe:
  `expect(await axe(container)).toHaveNoViolations()`) over their own output;
  E2E flows run axe-playwright on key pages. Documented exceptions only — this
  is how the rules/ui-ux.md a11y bar gets enforced, not just hoped for.
- Tests are deterministic: no real network/clock — stub at the boundary.
  Flaky tests are fixed immediately, never retried-until-green.
- Keep tests next to code (`foo.test.ts` beside `foo.ts`) unless the project
  already does otherwise — check before creating new patterns.
