---
name: react-quality
description: Improve React/Next.js TypeScript code quality. Use when writing or reviewing React code, component APIs, hooks, state models, or TypeScript types — especially decisions around unions, enums, const data, derived types, and maintainability.
---

# React Quality

Applies after `react-component` has chosen placement and server/client
boundaries. Goal: code that stays easy to change after the UI ships.

## Procedure

1. **Model states explicitly.** Use discriminated unions for async/UI states
   instead of multiple booleans:
   `type State = { status: "loading" } | { status: "success"; data: Item[] }`.
2. **Prefer literal unions over enums.** For app-level variants, statuses,
   tabs, sizes, and component modes, use `as const` arrays/objects plus derived
   union types. Use `enum` only when interoperating with an external enum-like
   API or generated code.
3. **Keep constants typed and close.** Put small component-only constants near
   the component. Export shared constants from a narrow domain file:
   `export const STATUSES = ["draft", "published"] as const;`
   `export type Status = (typeof STATUSES)[number];`
4. **Derive, don't duplicate.** Prefer `Pick`, `Omit`, indexed access types,
   `ComponentProps<typeof Button>`, and `satisfies` over manually copied
   shapes. Duplicated types drift.
5. **Make illegal props impossible.** Replace boolean combinations with a
   `variant` union or discriminated prop union. If a prop is only valid in one
   mode, encode that in the type.
6. **No weak escapes.** Avoid `any`, broad `Record<string, unknown>` for known
   shapes, non-null assertions, and `as` casts. If a cast is unavoidable, keep
   it local and explain the invariant.
7. **Separate transforms from rendering.** Derived lists, grouping, sorting,
   and formatting belong in small pure helpers when they would distract from
   JSX. Test helpers when they contain branching logic.
8. **Keep hooks boring.** Hooks should have one reason to exist, stable return
   shapes, and no hidden global writes. Prefer server data + props over client
   fetching for initial render.
9. **Review the public API.** Before done, read the component from the caller's
   side: names, defaults, required props, variants, and empty/error handling
   must be obvious without opening the implementation.

## Anti-patterns

- `isLoading`, `isError`, `isEmpty`, `data` all independent.
- `enum ButtonVariant` for purely local UI variants.
- Exporting every internal type "just in case".
- A prop named `data` when a domain name like `user`, `invoice`, or `items`
  would make the component self-documenting.
- `useMemo` as a default. Use it only when there is a measured or obvious
  expensive calculation or referential stability requirement.
