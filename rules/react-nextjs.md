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

## Structure
- Feature-first folders; route-private components colocated with the route,
  shared ones in the agreed shared dir (check `memory/conventions.md`).
- `loading.tsx` / `error.tsx` / `not-found.tsx` boundaries per route group
  where the UX needs them — they are part of the design, not optional.

## Discipline
- Props typed explicitly; no `any` at component boundaries.
- `next/image` for images, `next/link` for internal navigation, metadata API
  for SEO — no hand-rolled equivalents.
- Every list render: stable keys (never array index for mutable lists).
