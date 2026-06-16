# DEVELOPMENT — handoff for Codex (and any AGENTS.md tool)

> Dev-facing state of the **framework itself**. Read this first to continue the
> work. Excluded from the CLI's published template snapshot — adopters never see
> it. The in-repo `memory/` is intentionally placeholder state (shipped payload);
> the real dev roadmap lives here. Last updated: 2026-06-12.

## Start here (Codex)

1. Read `AGENTS.md` — it's read natively; rules + workflow + memory protocol apply.
2. **No slash commands in Codex.** The `/configure`, `/customize`,
   `/init-foundation`, `/write-spec` etc. are Claude Code wrappers. To use one,
   tell yourself: *"read `.claude/skills/<name>/SKILL.md` and follow it."*
3. Verify the repo is healthy before changing anything:
   - `pnpm check:framework` — framework integrity (mirror parity, config↔fs, budgets)
   - `cd cli && npm install && npm run check && npm test` — CLI typecheck/lint/format + tests
   - `cd website && npm install && npm run check && npm run build` — the local site
4. Follow the workflow: spec → execute → verify → sync. Specs live in `specs/`
   (a spec is decided up front incl. the folder layout — see write-spec skill).

## What this repo is

`Agentik` = a framework template for agentic coding **plus** a CLI (`cli/`,
published as `create-agentik`) that scaffolds it into new or existing projects.
The repo root IS the template; `cli/` bundles a cleaned copy. There is also a
local marketing/docs **website** (`website/`, Next.js) — see git state below.

## Git state — IMPORTANT (what is and isn't committed)

Branch `main`. Latest framework commits: `accdc62` (handoff), `2ec1926` (SCSS
guidance, folder structure, memory science, broader detection).

- ✅ **Committed**: everything tracked — rules, skills, profiles, `cli/`, `docs/`,
  `framework.config.json`, scripts, AGENTS/README/CHANGELOG, `memory/*` templates.
  Working tree is clean.
- ⚠️ **NOT in git, local-only (by design, via `.git/info/exclude`)**:
  - **`website/`** — the ENTIRE site, including all the SCSS-module refactor, the
    `/docs` area, and component split. 0 tracked files. It exists only on disk.
    Plan: move it to its own repo. Until then it is **not backed up in git** — if
    you want it safe, `git init` inside `website/` as a standalone repo.
  - **`specs/*.md`** — dev specs (only `specs/TEMPLATE.md` + `.gitkeep` tracked),
    so framework dev-specs never ship to adopters.
  - **`.claude/launch.json`** — local preview config.

## Current state

**Framework (committed):**
- Core rules incl. `security`, `validation` (zod v4), React 19 + a11y; tool-
  agnostic `ui-ux` with **SCSS Modules default** + `tokens.scss` asset.
- **feature/component-based, folder-per-component** structure in
  `rules/react-nextjs.md` + react-component skill; layout decided at planning
  time (`write-spec` skill + spec TEMPLATE).
- Reversible config system: `framework.config.json` + `configure` skill +
  `.framework/disabled/` parking. Personalization: `rules/custom/`,
  `memory/domain.md`, `customize` skill.
- `docs/memory-model.md` grounds the memory design in verified research
  (Lost-in-the-Middle 2307.03172, MemGPT 2310.08560, CoALA 2309.02427,
  Generative Agents 2304.03442); memory files labelled by CoALA type.
- CI: `.github/workflows/` (framework integrity + adopter `verify.yml` asset).

**CLI (`cli/`, committed):**
- Greenfield scaffold + `add` (existing projects) + ownership-aware `update`.
- Smart `detect.js`: language (node/python/rust/go), monorepo, Next router,
  language-aware gates + package manager; non-JS → generic profile with correct
  gate proposals. `--dry-run` + dirty-tree warnings. Dogfooded (tsc checkJs +
  eslint + prettier). Cross-platform CI matrix (ubuntu+windows × node 18/20/22).

**Website (`website/`, local-only):**
- Next.js marketing one-pager + `/docs` area (own routes + sidebar, 6 core pages).
- Refactored to **folder-per-component + SCSS Modules**: `tokens.scss` extracted;
  Hero, ProblemStrip, SystemSection, SiteHeader, SiteFooter, CopyCommand have
  colocated `*.module.scss`; `globals.scss` is the shared design-system layer only
  (**1067 → 588 lines**). Verified pixel-identical at 640 + 1280.
- `website/AGENTS.md` warns: **this is NOT the Next.js you know** — read
  `node_modules/next/dist/docs/` before writing Next-specific code.

## Open / next

1. **Publish `create-agentik`** (needs an npm account):
   ```
   cd cli && npm run check && npm test && npm pack --dry-run   # eyeball: ~88 files, ~63 kB, no leaks
   npm login && npm publish --access public                     # prepack + prepublishOnly run automatically
   npm create agentik@latest /tmp/smoke -- --profile generic --yes
   ```
   Name `create-agentik` is available (npm 404). Consider `0.1.0` for a first
   release. The site's install command only works AFTER publish.
2. **Website**: secure it (`git init` in `website/`) → own GitHub repo →
   hosting/domain (`metadataBase` = `agentik.dev`, add a real OG image). PostCSS
   audit advisory is nested in Next — wait for a patched Next, do NOT `audit fix --force`.
3. **Optional, low value**: extract a shared `SectionHeading` component so
   Architecture/OpenSource/FinalCta can also be modularized (they currently use
   the global `.section-heading` group). Transactional `add`/`update`.

## Working agreement

Follow `AGENTS.md`: spec before non-trivial work; keep all gates green; finished
specs → `specs/archive/`. Framework dev-history goes in git/CHANGELOG, **never**
into the shipped `memory/` (keep CONTEXT.md / domain.md as pristine templates).
