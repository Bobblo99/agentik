# Rule — Security (core, always active)

Baseline against the defects an agent realistically ships. Not a full audit —
depth for your domain lives in the Project-specific section. Pairs with
rules/validation.md (untrusted input) and rules/error-handling.md (no leaks).

## Authorization is server-side, always
- **Server Actions and route handlers are public endpoints.** Hiding a button
  in the UI is not access control. Every mutation checks session + permission
  on the server, inside the handler — re-derive identity from the session,
  never trust an id sent by the client.
- Validate every request body/params at the boundary (rules/validation.md)
  before any logic. Authorize, then act.

## Injection & XSS
- No `dangerouslySetInnerHTML` with unsanitized input — prefer text; if HTML
  is unavoidable, sanitize (e.g. DOMPurify) and say why in a comment.
- No `eval` / `new Function` / dynamic `import()` on user input.
- Validate `href`/`src` schemes — reject `javascript:`/`data:` where a URL is
  expected.
- Database access is parameterized (ORM bindings or prepared statements) —
  never string-built SQL. Don't pass user input into shell or filesystem paths.
- Validate outbound request URLs (SSRF): no user-controlled host for
  server-side fetches without an allowlist.

## Secrets
- Anything reaching the client bundle is **public**: `NEXT_PUBLIC_*`
  (Next.js), and any value imported into a Client Component. Server-only
  secrets stay server-only — use the `server-only` package / `env.ts`.
- Never log secrets, tokens, or full request bodies with credentials.
- Secrets come from env (rules/error-handling.md), never hardcoded or committed.

## Auth, transport, dependencies
- Sessions in httpOnly + Secure + SameSite cookies — not `localStorage`.
- Security headers where the framework allows (CSP, HSTS,
  X-Content-Type-Options) via `next.config`/middleware. Rate-limit public
  mutation endpoints.
- `pnpm audit` is part of the gate; review and pin new dependencies before adding.
- Client/user-facing errors never expose stack traces or internals
  (rules/error-handling.md).

## Project-specific
Your threat model, auth provider rules, data-classification and compliance
constraints are project decisions — record them as an ADR in
`memory/decisions/` and append domain security rules below this line after init.
