# Rule — API Design (profile: fullstack)

- **Contract before code**: method, path, request/response schemas and error
  cases are written in the spec first.
- Validate every request at the boundary with a schema (zod by default);
  400 with field-level details on failure.
- Handlers are thin: parse → service call → map to response. Business logic
  lives in plain, unit-testable modules — never inline in the route.
- Consistent JSON shape across the API. Pick ONE convention and record it as
  an ADR; default:
  success → resource/data directly with correct 2xx;
  error → `{ "error": { "code": "machine_readable", "message": "human" } }`.
- Correct status codes: 400 invalid input, 401 unauthenticated,
  403 unauthorized, 404 missing, 409 conflict, 422 semantic rejection,
  5xx only for genuine server faults.
- Auth is an explicit per-endpoint decision recorded in the spec — public
  endpoints are declared public, not forgotten.
- Pagination for every list endpoint that can grow (limit/cursor); no
  unbounded responses.
- Don't break consumers: additive changes are free; breaking changes need a
  documented migration path (ADR).
