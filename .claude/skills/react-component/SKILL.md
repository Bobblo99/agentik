---
name: react-component
description: Create or refactor React/Next.js components. Use for any component, page, layout, or hook work in a React or Next.js codebase — including the server-vs-client decision, file placement, props design, and state handling.
---

# React Component

Follows `rules/react-nextjs.md` (binding). This skill is the build sequence.

## Procedure

1. **Server or client?** Default: Server Component. Add `"use client"` only
   for interactivity (handlers, state, browser APIs) — and push the client
   boundary as deep (leaf-ward) as possible. Record non-obvious choices in
   the spec.
2. **Placement**: feature-first. Component used by one route → colocate next
   to it; shared across features → `components/` (or the project's agreed
   shared dir — check `memory/conventions.md`). Verify existing structure
   with a directory listing before creating files.
3. **Props**: explicit TypeScript interface, no `any`. Narrow inputs (pass
   `user`, not `data`). Avoid boolean explosion → use a `variant` union.
4. **Data**: fetch on the server (RSC or route handler) — never `useEffect`
   + fetch for initial data. Client state is for UI state only.
5. **States**: implement loading/empty/error/success per the spec
   (frontend-design skill). In App Router prefer `loading.tsx` /
   `error.tsx` boundaries where they fit.
6. **Tests**: per the spec's test cases — render states, interactions by
   role/label (write-tests skill).
7. `pnpm verify` + the visual check.

## Anti-patterns

- `"use client"` at the top of a page "to be safe".
- Components reading global stores when a prop would do.
- One 400-line component instead of composition.
- Inventing a component API without checking how siblings do it.
