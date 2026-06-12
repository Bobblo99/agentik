---
name: init-foundation
description: Set up the Agentik framework in a new or existing project. Use this on the FIRST session in any project that contains this template, whenever the user says "init", "set up", "start a new project", or when AGENTS.md still shows "ACTIVE_PROFILE: none". Interviews the user, activates a profile, configures quality gates and initializes memory.
---

# Init Foundation

Turn the generic template into a configured project. Run once per project.

## Step 1 — Interview (ask, don't assume)

Ask these questions (one message, short):
1. **Profile?** `web-frontend` (React/Next.js app), `fullstack`
   (frontend + API/DB), or `generic` (CLI, library, other stack).
   Read `profiles/<choice>/profile.md` for what each activates.
2. **Project name + one-sentence purpose?** (goes into AGENTS.md and CONTEXT.md)
3. **Business domain?** What does the product do, who for, and are there
   central domain concepts or hard rules an agent must respect (e.g. "money is
   always cents", "multi-tenant — always filter by tenant")? Keep it short;
   this seeds `memory/domain.md` and may become `rules/custom/` rules.
4. **Existing codebase or greenfield?** If existing: which commands currently
   run typecheck/lint/tests?
5. Any deviations from the profile defaults? (only if the user seems opinionated)

## Step 2 — Activate the profile

Read `profiles/<profile>/profile.md` and follow its manifest exactly:
1. Keep the listed rules/skills. **Disable (don't delete)** the ones the
   manifest marks "Disable/park": set them `false` in `framework.config.json`
   and MOVE them to `.framework/disabled/` (rule → `.framework/disabled/rules/`
   + its mirror → `.framework/disabled/cursor/`; skill dir →
   `.framework/disabled/skills/`). This keeps switching profiles lossless while
   agents still never read the parked files. The `configure` skill does exactly
   this if you'd rather delegate. Set `"profile": "<profile>"` in the config.
2. Update the Skills and Rules tables in `AGENTS.md` to list only what's active.
3. Replace `<!-- ACTIVE_PROFILE: none … -->` in AGENTS.md with
   `<!-- ACTIVE_PROFILE: <profile> (initialized YYYY-MM-DD) -->`.
4. Set the project name/purpose in AGENTS.md (first paragraph) and README.
5. Run `pnpm check:framework` — config ↔ filesystem must be consistent.

## Step 3 — Make the quality gates real

1. Replace the `[stub]` scripts in `package.json` with real commands
   (profile.md lists the defaults, e.g. `tsc --noEmit`, `eslint .`,
   `vitest run`). For an existing codebase, use ITS commands.
2. **Copy the profile's assets** per its "Assets to copy" section (configs +
   `.github/workflows/verify.yml`). Greenfield: copy them in and have
   `tsconfig.json` extend `tsconfig.base.json`. Existing project: offer the
   deltas, never overwrite the user's configs. Delete the asset source dir
   once copied.
3. Install/verify the needed dev dependencies the configs require (e.g.
   `eslint`, `typescript-eslint`, `prettier`) — check `package.json` first,
   never assume a tool is installed.
4. Run `pnpm verify`. It MUST pass (greenfield: with a placeholder test)
   before init is complete. If it can't pass yet, record why in CONTEXT.md
   under "Open questions".

## Step 4 — Initialize memory

1. `memory/CONTEXT.md`: fill the template with the real current state.
2. `memory/domain.md`: fill it from the domain answers (product, core model,
   hard invariants, non-goals); add domain nouns to `memory/glossary.md`. If a
   stated constraint is a binding rule, offer to capture it as a `rules/custom/`
   rule via the `customize` skill (don't force it — ask).
3. `memory/decisions/0001-adopt-agentik.md` already exists — update
   its date and add the chosen profile and any deviations.
4. If the user stated code conventions in the interview, record them in
   `memory/conventions.md`.

## Step 5 — Report

Summarize in chat: chosen profile, modules parked (disabled), gates
configured, verify status, and the user's next step (usually `/write-spec`).
Mention they can switch profile or toggle modules later via `/configure`.

## Anti-patterns

- Activating a profile without the interview.
- Leaving stub scripts in package.json ("verify passed" would be a lie).
- DELETING deactivated rules/skills — park them in `.framework/disabled/` so a
  later `/configure switch-profile` can bring them back losslessly.
- Editing the config but not moving the files (or vice versa) —
  `pnpm check:framework` will flag the drift.
