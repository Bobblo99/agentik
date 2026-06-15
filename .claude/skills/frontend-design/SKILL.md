---
name: frontend-design
description: Design and build user-facing UI that looks intentional, not generic. Use whenever creating or significantly changing a page, screen, layout, or visual component — any task where a human will SEE the result — even if the user only says "build a page for X". Complements rules/ui-ux.md (the rules say WHAT must hold; this skill says HOW to get there).
---

# Frontend Design

Process for UI work. Goal: deliberate design decisions instead of default-
looking output, and zero "forgot the empty state" bugs.

## Procedure

1. **States before pixels.** Before any JSX, enumerate in the spec every
   state this UI can be in: loading, empty, error, success/partial, and any
   interaction states. Each needs a designed treatment — an empty state is
   content (icon + one sentence + primary action), not a blank div.
2. **Sketch the layout in words**: regions, hierarchy, what's most important
   on the screen, where the primary action lives. One short paragraph in the
   spec. This forces a decision instead of defaulting to "card grid again".
3. **Tokens only.** Colors, spacing, radii, typography come from the design
   tokens (CSS custom properties consumed in SCSS Modules by default, or the
   Tailwind theme). A raw hex value or magic pixel number in component code is
   a bug (rules/ui-ux.md). Need a new value → add a token.
4. **Responsive from the start**: build mobile-first; verify 375px, ~768px,
   ~1280px. No horizontal scroll, tap targets ≥ 44px.
5. **A11y pass while building, not after**: semantic elements (button is a
   `<button>`), every input labeled, focus visible and in logical order,
   images have alt, color is never the only signal, contrast ≥ 4.5:1.
6. **Visual check = part of done.** Render the result (dev server,
   Playwright screenshot, or chrome-devtools MCP if configured) and walk
   the spec's "Visual / UX acceptance" list state by state. If you cannot
   render it yourself, explicitly hand the user the checklist to confirm —
   never declare a UI task done unseen.

## Anti-patterns

- Building only the success state.
- Hardcoded colors/sizes "temporarily".
- Desktop-only thinking, retrofitting mobile.
- `<div onClick>` instead of a button; placeholder-as-label.
