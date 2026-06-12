---
name: debugging
description: Systematically diagnose and fix bugs, errors, failing tests, or unexpected behavior. Use whenever something is broken, an error message appears, tests fail, or the user describes "doesn't work / weird behavior" — before attempting any fix.
---

# Debugging

Hypothesis-driven. No fix without a verified cause; no closed bug without a
regression test.

## Procedure

1. **Reproduce** deterministically: the exact command/steps + the exact
   error output. Can't reproduce → that IS the first problem to solve;
   gather more info, don't fix blind.
2. **Read the actual error.** Whole stack trace, first error not the last
   cascade. Quote the relevant line in your reasoning.
3. **Hypothesize**: state 1–3 candidate causes, ranked. For each: what
   observation would confirm/refute it?
4. **Verify the hypothesis** with the cheapest probe: read the code path,
   add a targeted log/assert, write a minimal failing test, `git log` the
   recently changed files. Do NOT change behavior yet.
5. **Fix the cause, not the symptom.** If the real fix is large, say so and
   propose it — don't silently band-aid.
6. **Regression test**: failing test first (per `write-tests`), then the
   fix, then green. Remove all debug logs.
7. **Verify**: full `pnpm verify`.
8. **Memory**: if the bug revealed a project pitfall or convention
   ("X must always Y"), add it to `memory/conventions.md`.

## Anti-patterns

- Shotgun changes ("try this… try that") without a hypothesis.
- Fixing the test instead of the bug to get green.
- Closing without a regression test.
- Leaving console.log/debugger artifacts.
