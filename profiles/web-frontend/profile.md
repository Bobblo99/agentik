# Profile: web-frontend

For React/Next.js applications where UI/UX quality is a priority.
Activated by the init-foundation skill.

## Keeps (rules)
core: 00-verification, security, validation, typescript, testing, error-handling, git-commits
profile: react-nextjs, ui-ux

## Keeps (skills)
core: write-spec, execute-spec, write-tests, code-review, debugging, architect
profile: frontend-design, react-component, react-quality

## Disable (park, not delete)
Set `false` in `framework.config.json` and move to `.framework/disabled/`
(the `configure` skill does this). Re-enable any time with `/configure`.
- rules: api-design (+ move its `.cursor/rules/api-design.mdc` mirror)
- skills: api-route, db-migration

## Default stack (install on greenfield; ask before changing an existing app)
- Next.js (App Router) + TypeScript strict
- **SCSS Modules** (`sass`) + design tokens as CSS custom properties in
  `styles/tokens.scss` — colocated `Component.module.scss` (see rules/ui-ux.md).
  Copy `assets/styles/tokens.scss` as the starter. (Alternative: Tailwind +
  shadcn/ui — same token principle; pick ONE, record it in conventions.)
- zod for boundary validation
- Vitest + @testing-library/react + jest-axe (+ Playwright/axe-playwright
  optional — ask) — see rules/testing.md
- ESLint + Prettier + eslint-plugin-jsx-a11y (a11y lint, rules/ui-ux.md)

## Assets to copy (init-foundation)
Copy from `profiles/web-frontend/assets/` into the project root, then install
the dev deps they need. These ship the standards as enforced config, not prose:
- `tsconfig.base.json` → root; your `tsconfig.json` extends it (`"extends":
  "./tsconfig.base.json"`). Encodes rules/typescript.md (incl.
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- `eslint.config.mjs` → root (flat config; needs `eslint`, `typescript-eslint`).
  Next.js: also add `next/core-web-vitals` + jsx-a11y to match rules/ui-ux.md.
- `.prettierrc.json`, `.editorconfig` → root.
- `styles/tokens.scss` → your `styles/` (design tokens as CSS custom
  properties; import once in the root layout). Needs `sass`.
- `workflows/verify.yml` → `.github/workflows/verify.yml` — CI gate on every PR.
Delete the asset source dir after copying; an existing project keeps its own
configs (offer the deltas, don't overwrite).

## package.json gate scripts
- typecheck: `tsc --noEmit`
- lint: `eslint .`
- test: `vitest run`

## Extra setup questions for the interview
1. Playwright E2E from day one? (default: no, add when first real flow exists)
2. Component library: shadcn/ui ok, or something existing?

## Done when
`pnpm verify` green (greenfield: with one placeholder test), AGENTS.md
tables updated, ACTIVE_PROFILE set, ADR-0001 completed.
