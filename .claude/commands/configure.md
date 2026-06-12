Read .claude/skills/configure/SKILL.md and follow it to change the framework's
active set. Read framework.config.json first for the current state. Map my
request below to an operation (status / enable / disable / switch-profile),
reconcile both the config and the files (parking disabled modules in
.framework/disabled/), and finish by running `pnpm check:framework` and
confirming it is green.

Request: $ARGUMENTS
