# Contributing to Agentik

This repo is a framework: its "code" is instructions (AGENTS.md, rules, skills,
profiles). Treat changes to them with the same rigor as code.

## Ground rules

- **Checkable language.** Every rule/spec/memory line must be verifiable
  ("`pnpm test` passes", "renders at 375px") — never vague ("clean code").
  See `rules/00-verification.md`.
- **One source of truth.** `AGENTS.md` stays ≤ ~150 lines and points down into
  `rules/` and `.claude/skills/`. Don't duplicate rule text into AGENTS.md or
  into the `.cursor/rules/*.mdc` mirrors — the mirrors are thin pointers.
- **Mirrors stay paired.** Every `rules/<name>.md` has a
  `.cursor/rules/<name>.mdc` pointer (and custom rules mirror under
  `.cursor/rules/custom/`). The framework check enforces this.
- **Budgets.** `AGENTS.md` ≤ 160 lines, `memory/CONTEXT.md` ≤ 80. Push detail
  into rules/skills/ADRs.

## The gate

```bash
pnpm check:framework   # mirror parity, rule wiring, line budgets — MUST pass
```

CI (`.github/workflows/ci.yml`) runs it on every PR. A change is not done until
it is green.

## Workflow

1. Branch. Describe the change in the PR.
2. For a non-trivial change, write a spec in `specs/` first (use `write-spec`).
3. Make the change; keep mirrors and AGENTS.md tables in sync.
4. `pnpm check:framework` green.
5. Conventional, imperative commit messages (`rules/git-commits.md`).

## Adding or changing a rule

- New framework rule → `rules/<name>.md` + `.cursor/rules/<name>.mdc` mirror +
  an entry in `framework.config.json` (`rules`) + list it in the AGENTS.md
  Rules section + the relevant `profiles/*/profile.md`.
- Project-specific rules belong in `rules/custom/` (see the `customize` skill),
  not in the framework's top-level `rules/`.
- Run `pnpm check:framework` (it enforces mirror parity + config↔filesystem
  consistency + budgets).

## Adding a skill

- `.claude/skills/<name>/SKILL.md` with `name` + `description` frontmatter
  (the description controls when it triggers). Add it to the AGENTS.md Skills
  table AND to `framework.config.json` (`skills`). Optionally a thin
  `.claude/commands/<name>.md` wrapper.

By contributing you agree your work is released under the repo's MIT license.
