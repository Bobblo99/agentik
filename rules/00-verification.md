# Rule 00 — Verification (non-negotiable, always active)

Purpose: zero hallucinated code. Every external reference is verified
before use. Read this rule at the start of every session.

## Before you use it, verify it

| You want to… | Required check first |
|---|---|
| Import a package | Name exists in `package.json` dependencies (exact spelling) |
| Import a local module | File exists on disk (`ls` the directory, don't guess paths) |
| Call a function/component | Open its definition; confirm signature and export |
| Use a library API | Confirm in `node_modules` type defs or official docs (context7 MCP if configured) — not from memory |
| Read an env var | It is declared in `.env.example`; new vars get added there first |
| Call an endpoint | Route exists in the codebase, or is documented for the external API |
| Follow a "known" pattern | The codebase actually uses it (grep for one example) |

## Behavioral rules

1. **Unsure = say so.** Write `UNVERIFIED: <thing>` in your output and ask,
   or verify before continuing. Guessing is the only forbidden option.
2. **Versions matter.** APIs differ across major versions. Check the
   installed version in `package.json` before applying docs knowledge.
3. **No phantom files.** Never reference paths in specs, code or docs that
   you have not listed/opened this session.
4. **Quote evidence.** When a claim matters ("X already handles retries"),
   cite file + line you actually read.

## Quality gates (Definition of Done, every task)

- `pnpm verify` exits 0 (typecheck + lint + tests).
- All acceptance criteria in the task's spec are checked off with evidence.
- UI tasks: the spec's visual/UX checklist completed (rendered and seen —
  by you or explicitly handed to the user).
- New logic has tests; bug fixes have a regression test.
