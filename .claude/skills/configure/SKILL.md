---
name: configure
description: Change which rules and skills are active, or switch the project's profile — reversibly. Use when the user says "switch to fullstack", "disable the api-route skill", "turn off the api-design rule", "enable react-component", "what's active?", "configure the framework", or wants to change framework settings. Reads/writes framework.config.json and reconciles files via the .framework/disabled/ parking area.
---

# Configure

The active set of rules/skills is declared in **`framework.config.json`** (the
source of truth) and materialized on disk. Deactivating a module **moves** it
to `.framework/disabled/` (agents never read there) instead of deleting it, so
every change is reversible and switching profiles is lossless.

Always finish with `pnpm check:framework` — it enforces config ↔ filesystem
consistency and that locked-core modules stay active.

## Locked core (never disable)
- Rules: `00-verification, security, validation, typescript, testing,
  error-handling, git-commits`.
- Skills: `write-spec, execute-spec, write-tests, code-review, debugging,
  customize, init-foundation, configure`.
If asked to disable one, refuse and explain it's non-negotiable (AGENTS.md).

## Paths (active ↔ parked)
| Module | Active path | Parked path |
|---|---|---|
| rule | `rules/<n>.md` + `.cursor/rules/<n>.mdc` | `.framework/disabled/rules/<n>.md` + `.framework/disabled/cursor/<n>.mdc` |
| skill | `.agentik/skills/<n>/` in compact or `.claude/skills/<n>/` in classic | `.agentik/disabled/skills/<n>/` in compact or `.framework/disabled/skills/<n>/` in classic |

## status
Read `framework.config.json` and report active vs disabled rules/skills and the
current `profile`. Run `pnpm check:framework` to confirm no drift.

## disable <rule|skill>
1. Reject if it's locked core (see above).
2. Set its value to `false` in `framework.config.json`.
3. Move it active → parked (use `git mv` when possible):
   - rule: move `rules/<n>.md` AND its `.cursor/rules/<n>.mdc` to the parked paths.
   - skill: move the whole active skill dir to the parked skills dir. In compact layout, also keep/remove the `.agentik/claude/skills/<n>/` mirror with it.
4. Update AGENTS.md (drop it from the Rules paragraph / Skills table).
5. `pnpm check:framework` → must be green.

## enable <rule|skill>
Reverse of disable: set `true`, move parked → active (including the cursor
mirror for a rule), add it back to the AGENTS.md list/table, run check-framework.

## switch-profile <name>
1. Read `profiles/<name>/profile.md` — it lists the rules/skills to Keep and to
   Disable for that profile.
2. For each module: `enable` the ones the profile keeps, `disable` the ones it
   drops (skipping locked core). This is just a batch of the operations above.
3. Set `"profile": "<name>"` in `framework.config.json` and update the
   `<!-- ACTIVE_PROFILE: ... -->` marker in AGENTS.md.
4. `pnpm check:framework` → green. Report what changed (enabled/disabled lists).

## Anti-patterns
- Deleting a module to "disable" it — park it, so it can come back.
- Editing the config but forgetting to move the files (or vice versa) —
  check-framework will catch the drift; always run it.
- Disabling locked core.
- Forgetting to move a rule's cursor mirror alongside the rule (breaks parity).
