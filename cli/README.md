# create-agentik

[![npm](https://img.shields.io/npm/v/create-agentik?color=cb3837&logo=npm)](https://www.npmjs.com/package/create-agentik)
[![downloads](https://img.shields.io/npm/dm/create-agentik)](https://www.npmjs.com/package/create-agentik)
[![license](https://img.shields.io/npm/l/create-agentik)](LICENSE)

**Make AI coding agents reliable in any repo — in one command.** Persistent
memory, a spec-before-code workflow, and **machine-enforced** quality gates.
Works with Claude Code, Codex, Cursor, and any [AGENTS.md](https://agents.md) tool.

```bash
npm create agentik@latest my-app
```

That's it. Pick a profile, name it, done — the scaffolder does the structural
work; your agent finishes setup.

<!-- Record with: vhs demo.tape -->

![demo](./demo.gif)

## Why

Agents forget context between sessions, drift from conventions, and hallucinate
APIs. Prose instructions don't fix that. `Agentik` ships three
mechanisms that do:

- **Memory as files** — current state, decisions (ADRs), conventions, domain.
- **Spec-driven workflow** — every non-trivial task starts as a checkable spec.
- **Enforced gates** — `pnpm verify` (typecheck + lint + test) is the
  Definition of Done, run by a hook and in CI. Plus a zero-hallucination
  verification rule.

## What you get

- A `web-frontend`, `fullstack`, or `generic` **profile** — opinionated rules
  (TypeScript strict, zod validation, security, React 19, a11y) and skills.
- Real configs shipped, not described: strict `tsconfig`, flat ESLint,
  Prettier, CI workflow.
- **Reversible by design** — switch profiles or toggle any rule/skill later
  with `/configure`; nothing is ever deleted, just parked.
- **Personalizable** — bring your own domain rules (`rules/custom/`) and
  business context with `/customize`; framework updates never clobber them.

## Usage

```bash
# Interactive (recommended)
npm create agentik@latest

# Non-interactive / scripted (zero dependencies)
npm create agentik@latest my-app -- \
  --profile web-frontend --name "My App" --yes

# Options
#   --profile <web-frontend|fullstack|generic>   default: web-frontend
#   --name <name>        project name (default: directory name)
#   --no-git             skip git init
#   --force              scaffold into a non-empty directory
#   -y, --yes            non-interactive (use flags + defaults)
```

## Already have a project? `add`

Drop the framework into an existing repo — it copies only framework files and
**never touches your code** (`package.json`, `src/`, `README` stay yours):

```bash
cd my-existing-app
npm create agentik@latest add        # auto-detects a profile from your deps
```

It overlays `AGENTS.md`, the rules/skills, memory, the **full config system**
(`framework.config.json`, `/configure`, `/customize`, profiles), merges the gate
scripts into your `package.json` (keeping any you already have), and applies a
profile. Re-running is safe (skips files that exist). Then run `/init-foundation`.

**It's smart about it.** `add` inspects your project and proposes a setup, then
asks you to confirm:

```
Smart detection
  Detected: Next.js, Prisma, TypeScript, vitest, ESLint, pnpm
  → profile: fullstack
  → gates:   typecheck=tsc --noEmit  lint=eslint .  test=vitest run
  → pm:      pnpm
Use this setup (profile: fullstack)?  (Y/n)
```

It picks the profile from your dependencies (Next/React/API/ORM-aware), reads
your package manager from the lockfile, and **wires the real gate commands** it
found (and adapts `verify.sh` to your package manager) — so there's almost
nothing left to configure.

## Keep it current: `update`

Refresh an adopted project without losing its knowledge or customizations:

```bash
cd my-project
npm create agentik@latest update -- --dry-run
npm create agentik@latest update
```

The command updates framework-owned rules, core skills, commands, profiles,
scripts, and documentation. It preserves `memory/`, `specs/`, custom rules and
skills, `framework.config.json`, package.json, README, LICENSE, environment
files, and application code. Existing disabled modules remain parked.

After create/add: open the project with your agent and run `/init-foundation`
(or say "init") to wire the quality gates and capture your domain.

## License

MIT
