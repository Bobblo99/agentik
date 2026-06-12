# AGENTS.md

Single source of truth for all coding agents (Claude Code, Codex, Cursor, …).
`CLAUDE.md` points here. Keep this file under ~150 lines — details live in
`.claude/skills/` and `rules/` and are loaded on demand.

<!-- ACTIVE_PROFILE: none — run the init-foundation skill (or /init-foundation) first -->

## Commands

```bash
pnpm verify          # typecheck + lint + test — MUST pass before any task is "done"
pnpm verify --quick  # typecheck + lint only (use during iteration)
pnpm typecheck       # tsc --noEmit (configured during init)
pnpm lint            # eslint (configured during init)
pnpm test            # vitest run (configured during init)
pnpm check:framework # framework integrity: mirror sync, rule wiring, budgets
```

CI runs `pnpm verify` on every PR (`.github/workflows/verify.yml`, added at
init); this repo's own integrity is guarded by `.github/workflows/ci.yml`.

## Non-negotiable rules

1. **Verify before use.** Never reference a file, function, package, API,
   endpoint or env var without confirming it exists. Full protocol:
   `rules/00-verification.md`. If you cannot verify, say
   `UNVERIFIED: <what>` and ask — never guess.
2. **No invented imports.** Every import must exist in `package.json`
   (packages) or on disk (local modules). Check first.
3. **Quality gates.** A task is done only when `pnpm verify` passes AND every
   acceptance criterion in its spec is checked off.
4. **Spec before code.** Every non-trivial task (touches >1 file, adds new
   logic, or takes >15 min) starts with a spec. See workflow below.
5. **Checkable language.** When writing specs, rules or memory entries, use
   verifiable statements ("`pnpm test` passes", "renders at 375px") — never
   vague ones ("works well", "clean code").

## Core workflow (every non-trivial task)

1. **Read memory.** Open `memory/CONTEXT.md` (now-state) and `memory/domain.md`
   (business/domain context). Scan `memory/conventions.md`, `memory/decisions/`,
   and any `rules/custom/` entries relevant to the task.
2. **Write a spec.** Follow the `write-spec` skill →
   `specs/YYYY-MM-DD-<slug>.md` from `specs/TEMPLATE.md`. Define test cases
   and acceptance criteria BEFORE writing code. For large or ambiguous tasks,
   get user approval of the spec before implementing.
3. **Execute the spec.** Follow the `execute-spec` skill: work the numbered
   steps in order, check them off in the spec file as you go. If reality
   forces a deviation, update the spec FIRST, then continue.
4. **Verify.** Run `pnpm verify`. Walk the spec's acceptance criteria one by
   one. For UI tasks, also complete the visual check defined in the spec.
5. **Sync memory.** Follow the memory protocol below, then move the finished
   spec to `specs/archive/`.

Trivial tasks (typo fix, one-line change) skip steps 2–3 but never step 4.

## Memory protocol

Read at task start, write at these moments — not "later":

| Event | Action |
|---|---|
| Architecture/tooling decision made | New ADR in `memory/decisions/` (use TEMPLATE) |
| Project-specific pattern discovered or agreed | Add to `memory/conventions.md` |
| New domain term used | Add to `memory/glossary.md` |
| Domain model / business invariant clarified | Update `memory/domain.md` (or a `rules/custom/` rule if binding — use the `customize` skill) |
| Task finished / session ends | Update `memory/CONTEXT.md` (state, next steps, open questions) |

`memory/CONTEXT.md` has a hard budget of 80 lines. When updating: remove
completed items, move decisions into ADRs, move patterns into conventions.
Never let it grow into a log.

## Skills

Located in `.claude/skills/<name>/SKILL.md`. Read the relevant skill before
starting that kind of work. Core (always active):

| Skill | Use when |
|---|---|
| `init-foundation` | First run in a new project — interview, pick profile, scaffold |
| `write-spec` | Starting any non-trivial task |
| `execute-spec` | Implementing an approved spec |
| `write-tests` | Writing or extending tests |
| `code-review` | Reviewing a diff, PR, or your own finished work |
| `debugging` | Any bug: reproduce → hypothesize → verify → fix → regression test |
| `customize` | Bring this project's domain in: add a `rules/custom/` rule, a domain term, or a project skill |
| `configure` | Switch profile or enable/disable rules & skills (reversibly) |

Profile skills (activated by `init-foundation`, see `profiles/`):
`frontend-design`, `react-component`, `api-route`, `db-migration`.

The **active set** of rules and skills is declared in `framework.config.json`
and managed with the `configure` skill (`/configure`). Disabled modules are
parked in `.framework/disabled/` (never read) — switching is lossless.
`pnpm check:framework` enforces config ↔ filesystem consistency.

## Rules

Located in `rules/`. Binding. Read the relevant file before working in that
domain. Always-active core: `00-verification.md`, `security.md`,
`validation.md`, `typescript.md`, `testing.md`, `error-handling.md`,
`git-commits.md`. Profile rules: `react-nextjs.md`, `api-design.md`,
`ui-ux.md`. **Project-owned: `rules/custom/`** — your domain rules, added via
the `customize` skill; the framework never overwrites them. Read those too.

## When stuck

- Requirements ambiguous → ask ONE focused question, don't assume.
- `pnpm verify` fails 3 times on the same error → stop, summarize what you
  tried, ask for human review.
- A rule conflicts with the task → say so explicitly; the user decides.
- Need library knowledge you're unsure about → check `node_modules` types or
  official docs (context7 MCP if configured). Do not code from memory.
