# DEVELOPMENT — handoff notes (not shipped to adopters)

> Dev-facing state of the **framework itself**. Any AGENTS.md tool (Codex,
> Cursor, Claude Code) can read this to continue the work. Excluded from the
> CLI's published template snapshot — adopters never see it.
> The in-repo `memory/` is intentionally placeholder state (it's shipped
> payload); the real dev roadmap lives here.

## What this repo is

`Agentik` = a framework template for agentic coding **plus** a CLI
(`cli/`, published as `create-agentik`) that scaffolds it into new or
existing projects. The repo root IS the template; `cli/` bundles a cleaned copy.

## Continue in Codex (or any AGENTS.md tool)

- **AGENTS.md is read natively** — the rules, workflow, and memory protocol all
  apply. Start there.
- **Skills/slash-commands are Claude Code-specific.** Codex has no `/configure`,
  `/customize`, `/init-foundation`. They are thin wrappers — to use one, tell
  the agent: *"read `.claude/skills/<name>/SKILL.md` and follow it."* Same
  outcome (see `docs/adopting.md` → Tool-specific notes).
- **Quality gates (run these):**
  - `pnpm check:framework` — framework integrity (mirror parity, config↔fs, budgets)
  - `cd cli && npm install && npm run check && npm test` — CLI typecheck/lint/format + 21 tests

## Current state (2026-06)

- Framework: core rules incl. `security`, `validation` (zod v4); reversible
  config system (`framework.config.json` + `configure` skill + `.framework/disabled/`);
  personalization (`rules/custom/`, `memory/domain.md`, `customize` skill);
  React 19 / a11y rules; CI (`.github/workflows/`).
- CLI: greenfield scaffold + `add` (existing projects) with smart detection
  (profile/package-manager/gates), and ownership-aware `update` for adopted
  projects. Both mutation flows support `--dry-run` and dirty-tree warnings.
  Dogfooded (tsc checkJs + eslint + prettier). Cross-platform (CI matrix
  ubuntu+windows × node 18/20/22).

## Website status (local-only, excluded from git)

Visual QA **done** (Claude, 2026-06-12): 375/768/1280 overflow-free, 404 usable,
tap targets ≥44px, focus-visible + reduced-motion present, anchor nav + install
command + GitHub links correct. Fixed a real defect in
`website/components/copy-command.tsx` (clipboard call had no try/catch → no
feedback in non-secure contexts; added guarded API + textarea fallback).
`npm run check` + `npm run build` green. Spec archived. Added a
"GROUNDED IN RESEARCH" section (#research) surfacing the memory science with the
four verified arXiv sources, styled in the existing workflow pattern (44px tap
targets, no overflow, build green). Added a **/docs area** — own routes +
sidebar, 6 core pages (Overview, Quickstart, How it works, Agents & skills,
Memory model, Rules & gates) in SCSS Modules + folder-per-component (DocsSidebar);
build green (6 static docs routes), active-state + responsive verified; content
grounded in the real framework material. **Marketing page split into
folder-per-component + SCSS Modules**: tokens.scss extracted; Hero, ProblemStrip,
SystemSection, SiteHeader, SiteFooter, CopyCommand have colocated `*.module.scss`;
globals.scss is now the shared design-system layer only (**1067 → 588 lines**).
Pixel-identical verified at 640 + 1280. Remaining: hosting/domain (metadataBase =
agentik.dev — confirm ownership + real OG image); optional: extract a shared
`SectionHeading` component to also modularize Architecture/OpenSource/FinalCta
(low value); move `website/` to its own repo.
Preview locally: `.claude/launch.json` has a `website` config (excluded from the
adopter snapshot via build-template DENY_LEAF).

## Research grounding (done 2026-06-12)

`docs/memory-model.md` grounds the memory design in verified literature
(Lost-in-the-Middle 2307.03172, MemGPT 2310.08560, CoALA 2309.02427, Generative
Agents 2304.03442). Each `memory/*` file is labelled with its CoALA memory type
(working/episodic/semantic/procedural); AGENTS.md names a consolidation trigger;
README has a "Grounded in research" note. Only web-verified citations used.

## Broader detection (done 2026-06-12)

`cli/lib/detect.js` now detects `language` (node/python/rust/go), `monorepo`
(pnpm-workspaces/turbo/lerna/nx/npm), Next `router` (app/pages/mixed), and
language-aware gates + package manager. Non-JS maps to the **generic** profile
with stack-correct gate proposals (Python ruff/mypy/pytest, Rust cargo*, Go go*)
— no new profile rule-sets by design. `add` on a non-JS project prints the
exact gates to wire into `scripts/verify.sh`. 5 new tests; e2e on Rust verified.

## Next up (none of the original 4-pick remain)

All four chosen dev focuses are done (update ✅ by Codex; dogfood ✅; robustness ✅;
broader detection ✅). Optional future:
1. Deferred robustness: transactional `add`/`update` (stage-then-move),
   config-schema migrations, greenfield wiring real gates.
2. Per-language framework profiles (python/rust) with their own rule-sets, if
   demand appears — currently generic + detected gates covers it.

## Release / publish runbook (`create-agentik`)

Status: package metadata complete; name `create-agentik` is **available** on npm
(404); `npm pack --dry-run` ships 87 files / ~61 kB (index.js, lib/, bundled
template, README, LICENSE) — no node_modules/tests/website leak. A
`prepublishOnly` hook runs `check` + `test`, so a broken build cannot publish.

Steps (you run these — they need your npm account):

1. `cd cli && npm run check && npm test` — confirm green locally.
2. `npm pack --dry-run` — eyeball the file list one last time.
3. `npm login` (once).
4. **Version:** currently `1.0.0`. Consider `0.1.0` for a first public release
   (signals "early"); bump with `npm version <x>` if so.
5. `npm publish --access public` (the `prepack` build + `prepublishOnly` gate
   run automatically).
6. Verify: `npm create agentik@latest /tmp/smoke -- --profile generic --yes`.
7. Tag the repo: `git tag vX.Y.Z && git push --tags`.

Dependency note: the website's install command (`npm create agentik@latest`)
only works AFTER step 5 — publish before promoting the site. PostCSS audit
advisory in the website is nested in Next; wait for a patched Next, do not
`audit fix --force`.

## Working agreement

Follow `AGENTS.md`: spec before non-trivial work (`specs/`), keep gates green,
finished specs → `specs/archive/`. Framework-dev history goes in git/CHANGELOG,
not into the shipped `memory/`.
