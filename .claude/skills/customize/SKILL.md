---
name: customize
description: Personalize the framework to this project's business domain — add a project-specific binding rule, capture a domain term/convention, or scaffold a project-only skill. Use whenever the user wants to encode a domain constraint, business rule, or invariant ("our money is always cents", "all PII must be tagged"), or says "add a project rule", "customize", "teach the framework about X".
---

# Customize

Bring this project's domain and hard constraints into the framework, the
supported way — so it survives framework updates and stays machine-checked.
Everything you create lives in **project-owned** locations the framework never
overwrites (`rules/custom/`, `memory/`, project skills).

Pick the mode that fits the request.

## Mode A — Add a project rule (a binding domain constraint)

1. **Interview the constraint** until it's stated in **checkable** language
   (`rules/00-verification.md`): "Money is integer cents in a `Money` branded
   type — floats are a defect", not "handle money carefully". One concern.
2. **Write** `rules/custom/<kebab-slug>.md` in the format of the top-level
   `rules/*.md` (short title, imperative bullets, every line verifiable).
3. **Mirror** it: create `.cursor/rules/custom/<slug>.mdc` using the existing
   pointer format (copy a top-level `.cursor/rules/*.mdc`, point `@rules/custom/<slug>.md`,
   set `alwaysApply: true` or scope `globs` to where it applies).
4. **Verify wiring:** AGENTS.md already points at `rules/custom/` as a
   directory — no per-file edit needed. Run `pnpm check:framework`; it MUST
   stay green (it enforces the custom rule ↔ mirror parity).
5. If the constraint is really an architecture decision, ALSO record an ADR in
   `memory/decisions/` and cross-link it from the rule.

## Mode B — Capture a domain term or convention

- New domain noun → add it to `memory/glossary.md` (term + one-line meaning).
- Central entity/invariant/non-goal → add to `memory/domain.md` (keep it dense,
  within its soft budget).
- Recurring code pattern that's now binding → add to `memory/conventions.md`.
No mirror/check needed — these are memory, not rules.

## Mode C — Scaffold a project-only skill

1. Create `.claude/skills/<name>/SKILL.md` with YAML frontmatter (`name`,
   `description` — the description decides when it triggers, write it for that).
2. Keep it a focused playbook; reference rules instead of restating them.
3. Add it to the AGENTS.md Skills table so humans/other tools see it.
   (Project skills are auto-discovered by Claude Code; the table is for clarity
   and for non-Claude tools.)

## Done when

- The artifact is in a project-owned location and follows the framework's
  format/discipline (checkable language, mirrors where applicable).
- `pnpm check:framework` is green (Mode A).
- The change is reflected where humans look (AGENTS.md table for skills;
  `rules/custom/` is self-listing for rules).

## Anti-patterns

- Editing framework `rules/*.md` to add project-specific content — put it in
  `rules/custom/` so updates don't clobber it.
- Vague rules ("be consistent") — if it isn't checkable, it isn't a rule yet.
- A custom rule without its cursor mirror (check-framework will fail).
