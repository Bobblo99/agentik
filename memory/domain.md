# Domain & Business Context

> Durable description of WHAT this product is and the domain it operates in —
> the counterpart to CONTEXT.md (which is volatile NOW-state). Agents read this
> at task start to produce relevant, domain-correct code. Filled by
> init-foundation; extended via the `customize` skill.
> SOFT BUDGET: ~60 lines. Keep it dense — definitions go to glossary.md,
> code patterns to conventions.md, decisions to decisions/.

## Product

<1–3 sentences: what the product does and for whom. Filled by init-foundation.>

## Core domain model

<The handful of central entities and how they relate, in plain language.
Not a schema dump — the mental model. e.g. "An Order has Line Items; an Invoice
is generated from a fulfilled Order; a Tenant owns everything.">

- <entity> — <one line: what it is, key relationship>

## Hard invariants & constraints

<Business rules that must always hold — the things a wrong implementation would
violate. These often become `rules/custom/*.md` entries (use /customize).>

- <invariant, stated checkably — e.g. "Money is integer cents, never float">

## Out of domain / non-goals

<What this product explicitly does NOT do — prevents scope drift.>

- <non-goal>
