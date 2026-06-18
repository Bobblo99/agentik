# Profile: fullstack

web-frontend plus API layer and database. Activated by init-foundation.

## Keeps (rules)
core: 00-verification, security, validation, typescript, testing, error-handling, git-commits
profile: react-nextjs, ui-ux, api-design

## Keeps (skills)
core: write-spec, execute-spec, write-tests, code-review, debugging, architect
profile: frontend-design, react-component, react-quality, api-route, db-migration

## Disable (park, not delete)
- nothing (full set — all rules/skills active). Toggle any later via `/configure`.

## Default stack
- Everything from web-frontend, plus:
- Drizzle ORM + PostgreSQL (default — ask; Prisma is a fine alternative,
  record the choice as an ADR)
- zod schemas shared between API boundary and forms

## Assets to copy (init-foundation)
Same as web-frontend — copy `profiles/web-frontend/assets/*` (tsconfig.base,
eslint, prettier, editorconfig, `workflows/verify.yml`). The TS/CI configs are
identical; add DB/migration tooling per the DB choice you record as an ADR.

## package.json gate scripts
- typecheck: `tsc --noEmit`
- lint: `eslint .`
- test: `vitest run`

## Extra setup questions for the interview
1. Database + ORM preference? (default Postgres + Drizzle → ADR)
2. Auth approach now or later? (if now: which provider → ADR)
3. Playwright E2E from day one?

## Done when
Same as web-frontend, plus: DB choice recorded as ADR, migration tool
commands verified and noted in memory/conventions.md.
