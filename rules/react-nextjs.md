# Rule — React / Next.js (profile: web-frontend, fullstack)

## Component model
- App Router. **Server Components by default**; `"use client"` only for
  interactivity, placed as deep in the tree as possible.
- Composition over configuration: small components, `children`/slots over
  prop drilling; extract when a component mixes concerns or passes ~3+ props
  through untouched.

## Data & state
- Initial data is fetched on the server (RSC / route handlers / server
  actions). **Never `useEffect` + fetch for initial load.**
- Server state (remote data) and UI state (toggles, inputs) stay separate.
  No global store for things one subtree needs.
- Mutations: server actions or route handlers; after mutation revalidate
  (`revalidatePath`/`revalidateTag`) instead of manual cache juggling.

## React 19 patterns
(Verify the installed React/Next major first — rules/00-verification.md.)
- Form mutations use **Actions** + `useActionState` for pending/error/result
  state; don't hand-roll `useState` loading flags around a fetch.
- `useOptimistic` for instant UI on mutations; reconcile on the server response
  (pairs with the optimistic-UI requirement in rules/ui-ux.md).
- Read promises/context with `use()`; wrap async reads in `<Suspense>` with a
  designed fallback, plus a route/segment **error boundary** for the failure
  path (not just `loading.tsx`).
- **Server Actions are public POST endpoints** — authorize + validate inside
  the action, every time (rules/security.md, rules/validation.md). Hiding the
  trigger in the UI is not access control.
- `useFormStatus` for pending UI in a form child, instead of prop-drilling it.

## Structure (feature/component-based, folder-per-component)
- Group by **feature**, not by file type. **Every component gets its own
  folder** — never a loose `Foo.tsx` among ten others. Standard layout
  (`src/` optional):
  ```
  app/                      # routes, layouts, route handlers (keep thin)
  features/<feature>/
    components/<Comp>/       # Comp.tsx · Comp.module.scss · Comp.test.tsx · index.ts
    hooks/  server/  api.ts  types.ts  utils.ts
  components/<Comp>/         # shared, cross-feature UI primitives (a folder each)
  server/                   # server-only: db, services, auth ('server-only' pkg)
  lib/                      # framework-agnostic clients/helpers
  hooks/   utils/   types/  # shared, pure
  styles/tokens.scss        # design tokens + global base
  ```
- **Colocate + barrel:** a component's files live together; an `index.ts`
  re-exports it so imports stay `@/components/<Comp>`.
- **Server vs client:** server-only modules live in `server/` and import the
  `server-only` package; Client Components are marked `"use client"` and pushed
  to leaves (see Component model). Never import `server/` into a client component.
- Route-private → colocate with the route; promote to a feature or shared
  `components/` only when reused. Check `memory/conventions.md` first.
- `loading.tsx` / `error.tsx` / `not-found.tsx` boundaries per route group
  where the UX needs them — part of the design, not optional.

## Discipline
- Props typed explicitly; no `any` at component boundaries.
- `next/image` for images, `next/link` for internal navigation, metadata API
  for SEO — no hand-rolled equivalents.
- Every list render: stable keys (never array index for mutable lists).
