---
name: api-route
description: Create or change API endpoints — Next.js route handlers, server actions, or backend routes. Use for any task involving an endpoint, API, webhook, mutation, or server action, including input validation and error responses.
---

# API Route

Follows `rules/api-design.md` (binding). Routes are thin; logic lives in a
service layer.

## Procedure

1. **Contract first** (in the spec): method, path, request schema, success
   response, error responses with status codes. Check existing routes for
   the project's conventions before inventing new ones.
2. **Validate at the boundary**: parse the request body/params with a schema
   (zod by default — verify it's in package.json first). Invalid input →
   400 with field-level details, never a 500 from deep inside.
3. **Thin handler**: handler does parse → call service → map result to
   response. Business logic goes in a plain, unit-testable function/module.
4. **Errors**: map known failure cases to correct status codes (401/403/404/
   409/422); unknown errors → log with context server-side, return a generic
   500 body without internals (rules/error-handling.md).
5. **Auth**: explicitly decide and note in the spec — public, session,
   token? Never "add auth later".
6. **Tests**: service logic unit-tested; handler tested for the contract —
   happy path, validation failure, and each mapped error case.
7. `pnpm verify`.

## Anti-patterns

- Trusting input because "the frontend validates".
- Returning raw error/stack messages to the client.
- Business logic inside the handler body.
- Inventing endpoints/response shapes that contradict existing ones.
