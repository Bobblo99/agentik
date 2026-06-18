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
    "debugging", "architect", "customize", "init-foundation", "configure",
}

errors = []


def err(msg):
    errors.append(msg)
    print(f"  ✗ {msg}")


config_path = "framework.config.json"
if os.path.isfile(".agentik/framework.config.json"):
    config_path = ".agentik/framework.config.json"

with open(config_path) as f:
    cfg = json.load(f)

layout = cfg.get("layout") or ("compact" if config_path.startswith(".agentik/") else "classic")
if layout not in {"classic", "compact"}:
    err(f"unknown layout '{layout}' in {config_path}")

if layout == "compact":
    ROOT = ".agentik"
    RULES = ".agentik/rules"
    CURSOR_RULES = ".agentik/cursor/rules"
    SKILLS = ".agentik/skills"
    CLAUDE_SKILLS = ".agentik/claude/skills"
    DISABLED = ".agentik/disabled"
else:
    ROOT = "."
    RULES = "rules"
    CURSOR_RULES = ".cursor/rules"
    SKILLS = ".claude/skills"
    CLAUDE_SKILLS = ".claude/skills"
    DISABLED = ".framework/disabled"

# --- Rules ---
cfg_rules = cfg.get("rules", {})
for name, active in cfg_rules.items():
    live = os.path.isfile(f"{RULES}/{name}.md")
    parked = os.path.isfile(f"{DISABLED}/rules/{name}.md")
    if name in LOCKED_RULES and not active:
        err(f"rule '{name}' is locked core and must stay active (true)")
    if active and not live:
        err(f"rule '{name}' is true but {RULES}/{name}.md is missing")
    if not active and live:
        err(f"rule '{name}' is false but {RULES}/{name}.md is still active (park it)")
    if not active and not live and not parked:
        err(f"rule '{name}' is false but found neither active nor parked")

# every active rule file (excluding custom/) must be in the config
if os.path.isdir(RULES):
    for fn in os.listdir(RULES):
        if fn.endswith(".md"):
            name = fn[:-3]
            if name not in cfg_rules:
                err(f"{RULES}/{fn} exists but is not listed in {config_path}")

# --- Skills ---
cfg_skills = cfg.get("skills", {})
for name, active in cfg_skills.items():
    live = os.path.isfile(f"{SKILLS}/{name}/SKILL.md")
    claude_live = os.path.isfile(f"{CLAUDE_SKILLS}/{name}/SKILL.md")
    parked = os.path.isfile(f"{DISABLED}/skills/{name}/SKILL.md")
    if name in LOCKED_SKILLS and not active:
        err(f"skill '{name}' is locked core and must stay active (true)")
    if active and not live:
        err(f"skill '{name}' is true but {SKILLS}/{name}/SKILL.md is missing")
    if active and layout == "compact" and not claude_live:
        err(f"skill '{name}' is true but Claude mirror {CLAUDE_SKILLS}/{name}/SKILL.md is missing")
    if not active and live:
        err(f"skill '{name}' is false but {SKILLS}/{name}/ is still active (park it)")
    if not active and not live and not parked:
        err(f"skill '{name}' is false but found neither active nor parked")

sys.exit(1 if errors else 0)
