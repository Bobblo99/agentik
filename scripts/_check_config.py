#!/usr/bin/env python3
"""Verify framework.config.json matches the active filesystem.

Invariants:
- Every rule/skill marked true exists in its active path; every false one does
  NOT (it should be parked in .framework/disabled/).
- Locked-core modules are always true.
- No active top-level rule is missing from the config, and no config entry
  names a module that exists in neither active nor parked location.
- Active skills absent from the config are project-owned (created by customize)
  and are intentionally allowed.

Exits 0 if consistent, 1 otherwise (printing "  ✗ ..." lines). Run from repo root.
"""
import json
import os
import sys

LOCKED_RULES = {
    "00-verification", "security", "validation", "typescript",
    "testing", "error-handling", "git-commits",
}
LOCKED_SKILLS = {
    "write-spec", "execute-spec", "write-tests", "code-review",
    "debugging", "customize", "init-foundation", "configure",
}

errors = []


def err(msg):
    errors.append(msg)
    print(f"  ✗ {msg}")


with open("framework.config.json") as f:
    cfg = json.load(f)

# --- Rules ---
cfg_rules = cfg.get("rules", {})
for name, active in cfg_rules.items():
    live = os.path.isfile(f"rules/{name}.md")
    parked = os.path.isfile(f".framework/disabled/rules/{name}.md")
    if name in LOCKED_RULES and not active:
        err(f"rule '{name}' is locked core and must stay active (true)")
    if active and not live:
        err(f"rule '{name}' is true but rules/{name}.md is missing")
    if not active and live:
        err(f"rule '{name}' is false but rules/{name}.md is still active (park it)")
    if not active and not live and not parked:
        err(f"rule '{name}' is false but found neither active nor parked")

# every active rule file (excluding custom/) must be in the config
for fn in os.listdir("rules"):
    if fn.endswith(".md"):
        name = fn[:-3]
        if name not in cfg_rules:
            err(f"rules/{fn} exists but is not listed in framework.config.json")

# --- Skills ---
cfg_skills = cfg.get("skills", {})
for name, active in cfg_skills.items():
    live = os.path.isfile(f".claude/skills/{name}/SKILL.md")
    parked = os.path.isfile(f".framework/disabled/skills/{name}/SKILL.md")
    if name in LOCKED_SKILLS and not active:
        err(f"skill '{name}' is locked core and must stay active (true)")
    if active and not live:
        err(f"skill '{name}' is true but .claude/skills/{name}/SKILL.md is missing")
    if not active and live:
        err(f"skill '{name}' is false but .claude/skills/{name}/ is still active (park it)")
    if not active and not live and not parked:
        err(f"skill '{name}' is false but found neither active nor parked")

sys.exit(1 if errors else 0)
