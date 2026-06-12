# Orchestration: Planner → Executor → Reviewer

Pattern for delegating complex work to multiple agents (Claude Code
subagents, parallel Codex sessions, or simply sequential sessions). The
memory + spec files ARE the handoff mechanism — no shared chat needed.

## When to split a task

Split when at least one is true; otherwise stay single-agent (cheaper, less
coordination overhead):
- The task decomposes into independent units touching disjoint files.
- A fresh, unbiased review matters (security-relevant, public API, gnarly bug).
- The plan itself is hard and benefits from full-context thinking before any
  implementation context pollutes it.

## The three roles

**Planner** — reads memory + codebase, writes the spec(s). Output: one spec
per executable unit in `specs/`, each self-contained (an executor must
succeed with ONLY the spec + memory + repo). Never writes production code.

**Executor** — runs the `execute-spec` skill on exactly one spec. Knows
nothing outside spec + memory + rules. Checks off steps in the spec file;
records deviations there. Output: code + green `pnpm verify` + updated spec.

**Reviewer** — fresh context, runs the `code-review` skill against diff +
spec + rules. Output: the structured review (🔴/🟡/🟢) appended to the spec
under "Review". Blockers → back to an executor.

## Handoff convention (file-based)

1. All inter-agent state lives in the spec file and memory/ — never only in
   a chat. If it isn't written down, the next agent doesn't know it.
2. Spec `Status:` field is the state machine:
   `draft → approved → in progress → review → done`.
3. Parallel executors only on specs with disjoint "Affected files" lists —
   the Planner is responsible for guaranteeing that.
4. Memory writes during parallel work: executors append only to
   conventions/glossary; CONTEXT.md is updated once by the
   orchestrating/last agent to avoid conflicts.

## Claude Code concretely

Use subagents per role (e.g. a `reviewer` subagent with a fresh context
window). Codex equivalent: run roles as separate sessions over the same
repo — the files carry everything.
