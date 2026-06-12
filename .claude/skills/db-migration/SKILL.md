---
name: db-migration
description: Create or modify database schema via migrations. Use for any schema change, new table/column, index, constraint, or data backfill — regardless of ORM/tool (Prisma, Drizzle, raw SQL).
---

# DB Migration

Schema changes are one-way doors. Slow down accordingly.

## Procedure

1. **Identify the tool**: check the repo for the actual migration system
   (prisma/, drizzle/, migrations/) and its commands. Never assume.
2. **Plan in the spec**: tables/columns affected, new constraints, index
   needs, and the rollback story. Destructive change (drop/rename/narrow a
   type)? → flag it to the user explicitly before executing.
3. **Never edit an applied migration.** Fix-forward with a new one.
4. **Expand → migrate → contract** for changes on live data: add the new
   structure, backfill, switch readers/writers, only then remove the old —
   each phase its own migration.
5. **Backfills**: idempotent, batched for big tables, and stated in the spec.
6. **Test**: run the migration against a fresh dev database (up — and down
   if the tool supports it); update/regenerate types; run `pnpm verify`.
7. **Memory**: schema decisions with consequences (soft delete vs hard
   delete, multi-tenancy keys…) → ADR.

## Anti-patterns

- Editing the schema without a migration file.
- Renames done as drop+create (data loss).
- Backfill and schema change mixed in one irreversible step.
- "It worked on my empty dev DB" as the only test.
