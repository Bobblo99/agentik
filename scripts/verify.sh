#!/usr/bin/env bash
# verify.sh — single quality gate: typecheck + lint + test.
# A task is "done" only when this script exits 0 (AGENTS.md, non-negotiable rule 3).
#
# Usage:
#   pnpm verify           run all gates
#   pnpm verify --quick   skip tests (use while iterating, never to finish a task)
#
# Stack-agnostic by design: it only calls the package.json scripts
# `typecheck`, `lint`, `test`. Each project defines what those mean
# (configured by the init-foundation skill).

set -u
QUICK=0
[ "${1:-}" = "--quick" ] && QUICK=1

FAILED=0
STUBS=0

run_gate() {
  local name="$1"
  echo ""
  echo "── verify: $name ─────────────────────────────"
  # Detect unconfigured stub scripts from the template
  if grep -q "\"$name\": \"echo '\[stub\]" package.json 2>/dev/null; then
    echo "⚠ '$name' is still a template stub — run the init-foundation skill to configure it."
    STUBS=1
    return 0
  fi
  if pnpm run --if-present "$name"; then
    echo "✓ $name passed"
  else
    echo "✗ $name FAILED"
    FAILED=1
  fi
}

run_gate typecheck
run_gate lint
if [ "$QUICK" -eq 1 ]; then
  echo ""
  echo "── verify: test ──────────────────────────────"
  echo "↷ skipped (--quick). Run full 'pnpm verify' before marking the task done."
else
  run_gate test
fi

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "════ VERIFY FAILED — the task is NOT done. Fix the issues above. ════"
  exit 1
fi
if [ "$STUBS" -ne 0 ]; then
  echo "════ VERIFY INCOMPLETE — stub scripts detected, gates are not real yet. ════"
  exit 1
fi
echo "════ VERIFY PASSED ════"
