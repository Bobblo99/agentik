# Rule — TypeScript

- `strict: true` is non-negotiable. Never weaken tsconfig to silence errors.
  Go beyond it: `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
  are on in the shipped `tsconfig.base.json` (strict alone does NOT enable
  them) — index access is `T | undefined`, handle it. Relax a flag only via
  a recorded ADR.
- **No `any`.** Unknown input → `unknown` + narrowing (type guard / schema
  parse). `as` casts only with a comment explaining why it is safe.
- Use `satisfies` to check a value against a type without widening it
  (`const config = {…} satisfies Config`), instead of an annotation that loses
  literal types.
- Brand opaque primitives so they aren't interchangeable
  (`type UserId = string & { readonly __brand: 'UserId' }`, or
  `z.string().brand<'UserId'>()` — see rules/validation.md).
- Exported functions declare explicit return types. Internal ones may infer.
- **No `enum`** — use union types or `as const` objects.
- Model with discriminated unions instead of optional-field soups:
  `{ status: 'loading' } | { status: 'error'; error: E } | { status: 'ok'; data: T }`.
- Prefer `readonly` and immutability; mutate only with a measured reason.
- Naming: `camelCase` values/functions, `PascalCase` types/components,
  `SCREAMING_SNAKE` only for true constants. Files: `kebab-case.ts`
  (components: `PascalCase.tsx` if the project already does so — check).
- Named exports by default; default exports only where the framework
  requires them (Next.js pages/layouts).
- Max ~50 lines per function; longer → extract.
- Handle `null`/`undefined` at the edge where data enters; core logic
  receives validated, non-optional shapes.
- No `@ts-ignore`. `@ts-expect-error` only with a one-line justification.
