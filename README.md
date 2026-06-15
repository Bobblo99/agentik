# Agentik

**Make AI coding agents reliable in any repo — in one command.** Persistent
memory, a spec-before-code workflow, and quality gates that actually run.
Works with Claude Code, Codex, Cursor, and any [AGENTS.md](https://agents.md) tool.

[![npm](https://img.shields.io/npm/v/create-agentik?color=cb3837&logo=npm)](https://www.npmjs.com/package/create-agentik)
[![downloads](https://img.shields.io/npm/dm/create-agentik)](https://www.npmjs.com/package/create-agentik)
[![CI](https://img.shields.io/github/actions/workflow/status/Bobblo99/agentik/ci.yml?branch=main&label=CI)](https://github.com/Bobblo99/agentik/actions)
[![license](https://img.shields.io/npm/l/create-agentik)](LICENSE)

```bash
npm create agentik@latest my-app        # new project
npm create agentik@latest add           # …or add to an existing one
npm create agentik@latest update        # refresh framework-owned files later
```

🇩🇪 Deutsche Version: [README.de.md](README.de.md)

## Why

Agents forget context between sessions, drift from conventions, and
hallucinate APIs. Prose instructions alone don't fix that — this template
combines three mechanisms that do:

1. **Memory as files** — `memory/CONTEXT.md` (current state, hard 80-line
   budget), ADRs in `memory/decisions/`, `conventions.md`, `glossary.md`.
   Read at task start, written at defined moments (protocol in AGENTS.md).
2. **Spec-driven workflow** — every non-trivial task starts as a spec with
   checkable acceptance criteria and test cases designed before code, gets
   executed step-by-step, and ends with an acceptance walk.
3. **Enforced gates** — `pnpm verify` (typecheck + lint + test) is the
   Definition of Done. It's a script, not a suggestion; a Claude Code hook
   runs it automatically.

Anti-hallucination is rule zero: nothing is imported, called, or referenced
without verifying it exists first (`rules/00-verification.md`).

## Quick start

```bash
# 1. Scaffold (interactive: pick a profile, name it — done)
npm create agentik@latest my-app
cd my-app

# 2. Open with your agent and finish setup
claude               # or Codex, Cursor, …
/init-foundation     # wires the gates + captures your domain — or say "init"
```

The scaffolder does the structural work for you (template, profile,
`framework.config.json`, git). `/init-foundation` then handles the judgment
parts: wiring real gate commands and capturing your business domain.

**Already have a project?** Add the framework without touching your code:

```bash
cd my-existing-app
npm create agentik@latest add   # copies framework files only; never your src/package.json
```

Prefer no install step? `npx degit Bobblo99/agentik my-app` still works
(then run `/init-foundation`).

The chosen **profile** (`web-frontend`, `fullstack`, `generic`) keeps the
matching rules/skills and **parks the rest** in `.framework/disabled/` (nothing
deleted). Switch profile or toggle modules anytime with `/configure` — the
active set lives in `framework.config.json`. Then:

```
/write-spec add user login        # agent plans, you approve
/execute-spec specs/2026-...md    # agent builds, checks off, verifies
/sync-memory                      # end-of-session memory update
```

Codex and other tools follow the identical workflow via AGENTS.md — the
slash commands are convenience wrappers, not requirements.

## Stay current without losing your work

After adopting the framework, update it from any project root:

```bash
npm create agentik@latest update -- --dry-run
npm create agentik@latest update
```

`update` refreshes framework rules, core skills, commands, profiles, scripts,
and docs while preserving `memory/`, `specs/`, `rules/custom/`, custom skills,
`framework.config.json`, package.json, and application code. Disabled modules
stay parked, and the project's package-manager adaptation stays intact.

## Layout

```
AGENTS.md             single source of truth (CLAUDE.md points here)
framework.config.json active rules/skills + profile (manage via /configure)
.claude/skills/       how-to playbooks the agent loads on demand
.claude/commands/     /init-foundation /configure /customize /write-spec /execute-spec /…
rules/                binding standards (+ rules/custom/ for your domain rules)
.framework/disabled/  parked (disabled) modules — never read, brought back by /configure
specs/                one file per task: plan, test cases, acceptance, archive/
memory/               CONTEXT.md · domain.md · decisions/ · conventions.md · glossary.md
profiles/             web-frontend / fullstack / generic — module manifests
scripts/              verify.sh (gate) · check-framework.sh (integrity)
docs/                 orchestration, MCP guidance, adoption guide
```

## Design principles

- **One source of truth.** AGENTS.md ≤ ~150 lines, imperative, commands
  first; detail lives in skills/rules loaded on demand. Long context files
  measurably hurt agent performance.
- **Checkable over vague.** "`pnpm test` passes" beats "code is clean" —
  everywhere: rules, specs, memory.
- **Enforce, don't hope.** Rules that matter exist twice: as text and as an
  executable check (verify script, hooks).
- **Modular stack.** The core is stack-agnostic; React/Next.js lives in a
  removable profile.

## Grounded in research

The memory system isn't a tidy folder — it's a human-readable implementation of
established findings: small/budgeted working memory because long context
degrades ([*Lost in the Middle*](https://arxiv.org/abs/2307.03172)),
externalized files as tiered memory ([*MemGPT*](https://arxiv.org/abs/2310.08560)),
and a working/episodic/semantic/procedural split that mirrors cognitive-agent
architecture ([*CoALA*](https://arxiv.org/abs/2309.02427)) with an
encode→retrieve→consolidate cadence ([*Generative Agents*](https://arxiv.org/abs/2304.03442)).
Full rationale and the file→memory-type mapping: [`docs/memory-model.md`](docs/memory-model.md).

See `docs/adopting.md` for existing-project adoption and maintenance.

## Distribution

- Source and template repository: [Bobblo99/agentik](https://github.com/Bobblo99/agentik)
- npm scaffolder: [`create-agentik`](https://www.npmjs.com/package/create-agentik)
- The repository changelog describes Agentik itself. Adopted projects should
  start their own changelog for application changes.

## License

MIT — see [LICENSE](LICENSE).
