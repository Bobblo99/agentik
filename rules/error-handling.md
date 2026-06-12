# Rule — Error Handling

- **No silent failures.** Empty `catch` blocks are forbidden. Every catch
  either handles meaningfully, rethrows with context, or logs + degrades
  visibly.
- Validate external input (HTTP, env, file, user) at the boundary with a
  schema; inside the core, data is trusted because the boundary guaranteed it.
- Expected failures (not found, validation, conflict) are modeled in return
  types (discriminated union / Result), not thrown across layers.
  Exceptions are for the unexpected.
- Error messages: internal logs get full context (operation, inputs, cause
  chain); user/client-facing messages get a safe, actionable sentence and
  never internals or stack traces.
- Fail fast on misconfiguration: required env vars are checked at startup
  (parsed once, e.g. zod schema in `env.ts`), not deep in a request.
- UI: every async surface has a designed error state with a retry or next
  step (see ui-ux rule); never an infinite spinner or blank screen.
- Never swallow errors to make `pnpm verify` pass.
