#!/usr/bin/env bash
# check-framework.sh — integrity gate for the Agentik framework itself
# (and for adopters who customize rules). Verifies the structural invariants the
# framework relies on. Run by .github/workflows/ci.yml and `pnpm check:framework`.
#
# Checks:
#   1. Cursor mirror parity — every rules/*.md has a .cursor/rules/*.mdc and vice versa.
#   2. Custom (project-owned) rule ↔ mirror parity.
#   3. Config consistency — framework.config.json matches the active filesystem,
#      and locked-core modules stay active (needs python3; skipped if absent).
#   4. Line budgets — AGENTS.md <= 160, memory/CONTEXT.md <= 80 (AGENTS.md budgets).
#
# Bash + (optional) python3 for the JSON consistency check.

set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ "$(basename "$(dirname "$SCRIPT_DIR")")" = ".agentik" ]; then
  cd "$SCRIPT_DIR/../.." || exit 2
else
  cd "$SCRIPT_DIR/.." || exit 2
fi
FAILED=0

if [ -f ".agentik/framework.config.json" ]; then
  RULES_DIR=".agentik/rules"
  CURSOR_RULES_DIR=".agentik/cursor/rules"
  MEMORY_CONTEXT=".agentik/memory/CONTEXT.md"
else
  RULES_DIR="rules"
  CURSOR_RULES_DIR=".cursor/rules"
  MEMORY_CONTEXT="memory/CONTEXT.md"
fi

fail() { echo "  ✗ $1"; FAILED=1; }
ok()   { echo "  ✓ $1"; }

echo "── check: cursor mirror parity ───────────────"
for rule in "$RULES_DIR"/*.md; do
  [ -e "$rule" ] || continue
  base="$(basename "$rule" .md)"
  if [ ! -f "$CURSOR_RULES_DIR/$base.mdc" ]; then
    fail "$RULES_DIR/$base.md has no $CURSOR_RULES_DIR/$base.mdc mirror"
  fi
done
for mirror in "$CURSOR_RULES_DIR"/*.mdc; do
  [ -e "$mirror" ] || continue
  base="$(basename "$mirror" .mdc)"
  if [ ! -f "$RULES_DIR/$base.md" ]; then
    fail "$CURSOR_RULES_DIR/$base.mdc mirrors a missing $RULES_DIR/$base.md"
  fi
done
[ "$FAILED" -eq 0 ] && ok "every rule and mirror is paired"

echo ""
echo "── check: custom (project-owned) rule mirror parity ─"
CUSTOM_FAIL=0
for rule in "$RULES_DIR"/custom/*.md; do
  [ -e "$rule" ] || continue
  base="$(basename "$rule" .md)"
  [ "$base" = "README" ] && continue
  if [ ! -f "$CURSOR_RULES_DIR/custom/$base.mdc" ]; then
    fail "$RULES_DIR/custom/$base.md has no $CURSOR_RULES_DIR/custom/$base.mdc mirror"
    CUSTOM_FAIL=1
  fi
done
for mirror in "$CURSOR_RULES_DIR"/custom/*.mdc; do
  [ -e "$mirror" ] || continue
  base="$(basename "$mirror" .mdc)"
  if [ ! -f "$RULES_DIR/custom/$base.md" ]; then
    fail "$CURSOR_RULES_DIR/custom/$base.mdc mirrors a missing $RULES_DIR/custom/$base.md"
    CUSTOM_FAIL=1
  fi
done
[ "$CUSTOM_FAIL" -eq 0 ] && ok "custom rules and mirrors paired (or none yet)"

echo ""
echo "── check: framework.config.json ↔ filesystem ─"
if [ ! -f framework.config.json ] && [ ! -f .agentik/framework.config.json ]; then
  echo "  ⚠ framework.config.json not found — skipping (run init-foundation)."
elif ! command -v python3 >/dev/null 2>&1; then
  echo "  ⚠ python3 not found — skipping the config consistency check."
else
  if python3 "$SCRIPT_DIR/_check_config.py"; then
    ok "config matches active rules/skills; locked core intact"
  else
    FAILED=1
  fi
fi

echo ""
echo "── check: line budgets ───────────────────────"
check_budget() {
  local file="$1" max="$2" n
  n="$(wc -l < "$file" | tr -d ' ')"
  if [ "$n" -gt "$max" ]; then
    fail "$file is $n lines (budget $max)"
  else
    ok "$file: $n/$max lines"
  fi
}
check_budget AGENTS.md 160
check_budget "$MEMORY_CONTEXT" 80

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "════ FRAMEWORK CHECK FAILED — fix the invariants above. ════"
  exit 1
fi
echo "════ FRAMEWORK CHECK PASSED ════"
