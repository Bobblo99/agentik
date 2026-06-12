# Profile: generic

Stack-agnostic core for CLIs, libraries, scripts, or non-JS stacks.
Activated by init-foundation.

## Keeps (rules)
core: 00-verification, security, validation, testing, error-handling, git-commits
- typescript.md: keep only if the project is TS/JS; otherwise remove and
  optionally create a language rule modeled on it.
- validation.md: keep — the boundary-validation principle is universal; its
  zod specifics map to your stack's validator (note the mapping in conventions).

## Keeps (skills)
core: write-spec, execute-spec, write-tests, code-review, debugging

## Disable (park, not delete)
Set `false` in `framework.config.json` and move to `.framework/disabled/`
(the `configure` skill does this). Re-enable any time with `/configure`.
- rules: react-nextjs, ui-ux, api-design (and typescript if non-TS) — move
  each rule's `.cursor/rules/*.mdc` mirror along with it
- skills: frontend-design, react-component, api-route, db-migration

## Gate scripts
Map the three gates to whatever the stack uses — examples:
- Python: typecheck `mypy .` · lint `ruff check .` · test `pytest`
- Rust: typecheck `cargo check` · lint `cargo clippy -- -D warnings` · test `cargo test`
- TS lib: `tsc --noEmit` · `eslint .` · `vitest run`
For non-pnpm stacks, either keep a minimal package.json as the gate runner
or edit scripts/verify.sh to call the commands directly — record the choice
in memory/conventions.md.

## Assets to copy (init-foundation)
The web-frontend TS configs (tsconfig/eslint/prettier) are TS-specific — skip
them unless this is a TS lib. Copy `profiles/web-frontend/assets/workflows/
verify.yml` → `.github/workflows/verify.yml` and adapt its steps to the
stack's gate commands (swap `pnpm install`/`pnpm verify` for the real runner).

## Extra setup questions for the interview
1. Language/stack and its existing check commands?
2. Anything CI already enforces that verify.sh should mirror?

## Done when
`pnpm verify` (or the adapted verify.sh) green, AGENTS.md tables updated,
ACTIVE_PROFILE set, ADR-0001 completed.
