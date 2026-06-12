# Demo recording for create-agentik.
# Produces demo.gif — the README's hero asset.
#
# Prereq: install vhs (https://github.com/charmbracelet/vhs):  brew install vhs
# Record:  vhs cli/demo.tape
#
# This drives the `add` flow on a sample project so the smart detection +
# confirm UX is visible. Swap the command for the published one once live:
#   Type "npm create agentik@latest add"

Output demo.gif
Set FontSize 20
Set Width 1200
Set Height 700
Set Padding 24
Set Theme "Dracula"
Set TypingSpeed 60ms

# --- setup a throwaway sample project (hidden-ish, fast) ---
Type "mkdir demo-shop && cd demo-shop"
Enter
Sleep 400ms
Type `printf '{\"dependencies\":{\"next\":\"15\",\"@prisma/client\":\"5\"},\"devDependencies\":{\"typescript\":\"5\",\"vitest\":\"2\",\"eslint\":\"9\"}}' > package.json && echo '' > pnpm-lock.yaml`
Enter
Sleep 600ms

# --- the moment: one command, smart detection, confirm ---
Type "npm create agentik@latest add"
Sleep 800ms
Enter
Sleep 3s

# It detects Next.js + Prisma + TypeScript + Vitest + ESLint + pnpm,
# proposes the `fullstack` profile and wires the gates. Confirm:
Enter
Sleep 2.5s

Type "git status --short | head"
Enter
Sleep 2.5s
