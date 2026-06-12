# Rule — Git & Commits

- **Conventional Commits**: `type(scope): imperative summary` —
  types: `feat fix refactor test docs chore perf build ci`.
  Example: `feat(invoices): add CSV export for filtered lists`.
- Subject ≤ 72 chars, imperative ("add", not "added"). Body explains WHY
  when non-obvious; reference the spec file for spec'd work
  (`Spec: specs/2026-06-12-csv-export.md`).
- One logical change per commit. Spec steps make natural commit boundaries.
- Never commit: failing state on a shared branch, secrets/.env, commented-out
  code, debug logs, `node_modules`.
- Before committing: `git diff --staged` and read it; run
  `pnpm verify --quick` minimum, full `verify` before the final commit of a
  task.
- No `git push --force` on shared branches; no amending published commits.
