# Rule — UI / UX (profile: web-frontend, fullstack)

## Tokens & consistency
- All visual values come from **design tokens** — never raw hex colors or magic
  px in component code (a defect). The mechanism is the project's choice; the
  principle is non-negotiable. Add/extend a token rather than hardcode.
- Reuse existing components/variants; check what exists before building a
  near-duplicate.

## Styling (SCSS Modules by default; Tailwind is a documented alternative)
- Default: **CSS/SCSS Modules**, one `Component.module.scss` colocated with its
  component. No global class soup; global CSS is only resets + base element styles.
- Tokens live centrally as **CSS custom properties** (e.g. `styles/tokens.scss`
  → `:root { --color-…; --space-…; --radius-… }`) and are consumed via
  `var(--token)` in modules. One source of truth for color/space/type/radius.
- Class names are local to the module (no BEM ceremony needed — the module
  scopes them); compose with `class={styles.card}`.
- (Tailwind path: same token principle via the theme; pick ONE per project and
  record it in `memory/conventions.md`.)

## States are mandatory
- Every data-driven view designs and implements: **loading** (skeleton over
  spinner where layout is known), **empty** (icon/illustration + one
  explanatory sentence + primary action), **error** (human message + retry),
  **success**. A view missing one of these fails review.

## Accessibility (minimum bar, every task)
- Semantic HTML: real `<button>`, `<a>`, headings in order, landmarks.
- Every input has a visible `<label>` (placeholder ≠ label).
- Full keyboard operability; visible focus; logical focus order; modals trap
  and restore focus.
- Text contrast ≥ 4.5:1; color is never the only carrier of meaning.
- Meaningful `alt` text; decorative images `alt=""`.
- Announce async state changes to assistive tech: loading/success in an
  `aria-live="polite"` region (or `role="status"`), errors in `role="alert"` —
  a visual-only spinner/toast is invisible to screen readers.

## Responsive & feel
- Mobile-first; must work at 375px, 768px, 1280px. No horizontal scroll.
- Tap targets ≥ 44×44px; interactive elements have hover/active/disabled
  treatments.
- Perceived performance: optimistic UI or instant feedback (<100ms) on every
  action; no layout shift from late-loading content (reserve space).
- Respect `prefers-reduced-motion`: gate non-essential animation/transitions
  behind it (reduce or remove); never rely on motion as the only feedback.

## Definition of Done for UI
- The spec's "Visual / UX acceptance" checklist is completed against the
  RENDERED result (dev server / screenshot / Playwright) — state by state,
  breakpoint by breakpoint. Unseen UI is undone UI.
