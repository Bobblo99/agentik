# MCP Servers (optional building block)

MCP gives agents extra tools. Every always-on server costs context tokens in
every session — connect few, with intent. `.mcp.json.example` ships two;
copy to `.mcp.json` (gitignored) to enable.

## Recommended

**context7** — live, version-correct library documentation. The single most
useful anti-hallucination tool: instead of coding a library API from
training memory, the agent pulls the real docs for the installed version
(rules/00-verification.md explicitly points here).

**git** — structured history access (blame, log, diff) for debugging and
review work. Optional; plain CLI git often suffices in Claude Code.

## Profile add-on: web-frontend / fullstack

**chrome-devtools (or Playwright MCP)** — lets the agent render and inspect
the running UI itself, which upgrades the mandatory visual check
(rules/ui-ux.md) from "hand the user a checklist" to "agent verifies
state-by-state". Add it when UI work is frequent.

## Anti-patterns

- A dozen always-on servers "to be safe" — context tax in every session.
- MCP for what the agent already does well natively (file reads, grep).
- Secrets inside `.mcp.json` committed to git — the file is gitignored for
  a reason; document required env vars in `.env.example`.
