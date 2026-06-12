# Rule — Validation (core, always active)

Schema-validate every value that crosses a trust boundary; inside the core,
data is trusted because the boundary guaranteed its shape. zod is the TS
default — the same principle applies in any stack with its native validator.

## Schema-first
- The schema is the source of truth. Derive the type from it
  (`type User = z.infer<typeof UserSchema>`) — never hand-write a parallel
  `type`/`interface` that can drift.
- Parse, don't validate: pass the **parsed** result forward (typed, coerced),
  never the raw `unknown` input you started with.
- Co-locate schema + inferred type; export both from one module.

## Where to validate (the boundary)
Validate at every edge where untrusted data enters: HTTP body/query/route
params, form data, env vars, file/CLI input, `localStorage`/URL params, and
**third-party API responses** (they break contracts). Internal function args
are typed, not re-validated — schemas guard the edge, not every call.

## parse vs safeParse
- `safeParse` for expected failures (user input → field-level errors). Map
  `error` to the API error shape in rules/api-design.md (400 + field details).
- `parse` (throwing) only where failure is a programmer bug, not user input.
- Env: parse once at startup in `env.ts` (see rules/error-handling.md); fail
  fast on misconfiguration, never read raw `process.env` deep in a request.

## Shared schemas
- One schema serves both the client form and the server boundary (e.g.
  react-hook-form + zod resolver) so client and server validate identically.
  Record the shared-schema location in `memory/conventions.md`.

## Version discipline (zod v3 vs v4)
Per rules/00-verification.md, check the installed zod major in `package.json`
before applying API knowledge — v4 changed surface area:
- v4 ships under the `zod/v4` subpath alongside v3; confirm which the project
  imports before copying examples.
- `.strict()`/`.passthrough()` object methods → top-level `z.strictObject()` /
  `z.looseObject()`.
- Error customization unified under a single `error` param (replaces
  `message`/`invalid_type_error`); format issues with `z.flattenError()` /
  `z.treeifyError()`.
- `z.coerce` / branded types (`z.string().brand<'UserId'>()`) for IDs at the edge.

## Project-specific
Domain schemas, naming, and shared-schema location are project decisions —
record them in `memory/conventions.md` (patterns) and `memory/glossary.md`
(domain terms). Add project-only validation rules below this line after init.
