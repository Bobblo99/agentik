# rules/custom/ — your project's own rules

This directory is **yours**. The framework never writes here, so a framework
update (re-pulling `rules/*.md`, skills, profiles) can never clobber it.

Put project-specific **binding** standards here — the ones that encode your
business domain and hard constraints, e.g.:

- "All monetary values are integer cents in a `Money` branded type — never floats."
- "Every table with PII has a `data_classification` column; queries filter by tenant."
- "Public API responses are snake_case; internal types are camelCase (mapped at the edge)."

## How to add one

Use the **`customize` skill** (`/customize` in Claude Code, or say "add a
project rule") — it interviews the constraint, writes it here in checkable
language, creates the matching `.cursor/rules/custom/<slug>.mdc` mirror, wires
it into AGENTS.md, and runs `pnpm check:framework` so the invariants stay green.

To add one by hand, follow the format of the top-level `rules/*.md` files:
short, imperative, **checkable** statements (not "write clean code"). One
concern per file, `kebab-case.md`. Then create the cursor mirror and re-run
`pnpm check:framework`.

## Rules of the game

- Checkable language only — every line must be verifiable (see `rules/00-verification.md`).
- One domain concern per file.
- Each file needs a `.cursor/rules/custom/<same-name>.mdc` mirror pointing back
  here (`pnpm check:framework` enforces parity).
- These rules are as binding as the framework's. List them in your specs'
  "Related ADRs / memory" when relevant.
