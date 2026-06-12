---
name: code-review
description: Review code changes — a diff, a PR, a file, or your own finished work before declaring it done. Use whenever the user says review, check this, look over, QA, or after completing a spec as a self-review step.
---

# Code Review

Review against three sources: the spec, the rules, and the verification
protocol. Opinions come last and are labeled as such.

## Procedure

1. **Scope**: identify the diff (default: uncommitted changes via
   `git diff` + `git status`). Read the related spec if one exists.
2. **Gate check first**: was `pnpm verify` run and green? If unknown, run it.
   A review of unverified code starts there.
3. **Walk the checklist**:
   - Spec compliance: every acceptance criterion met? scope creep?
   - `rules/00-verification.md`: any unverified imports, paths, env vars,
     APIs? (grep imports against package.json; check new env vars are in
     `.env.example`)
   - Domain rules: check against the relevant `rules/*.md` for the touched
     file types.
   - Tests: do the spec's test cases exist and actually assert behavior?
   - Error handling: failure paths handled per `rules/error-handling.md`?
   - UI (if applicable): states complete, tokens used, a11y basics?
4. **Output format**:
   - 🔴 **Blockers** — violates a rule or the spec; must fix.
   - 🟡 **Should fix** — defect or risk, fix unless justified.
   - 🟢 **Suggestions** — improvements, explicitly optional.
   Each finding: file:line, what, why (cite the rule/spec line).
5. If reviewing your own work: fix all 🔴 and 🟡 before declaring done.

## Anti-patterns

- Style nitpicks presented as blockers.
- "LGTM" without running the checklist.
- Reviewing the diff without the spec.
