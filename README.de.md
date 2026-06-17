# Agentik

Ein wiederverwendbares Repository-Template für **agentisches Coden** — ein
Satz Dateien, mit dem Claude Code, Codex, Cursor und jedes
AGENTS.md-kompatible Tool an deinem Projekt arbeiten: mit persistentem
Gedächtnis, verpflichtendem Plan-vor-Code-Workflow und maschinell
erzwungenen Quality Gates.

🇬🇧 English version: [README.md](README.md)

## Warum

Agenten vergessen Kontext zwischen Sessions, weichen von Konventionen ab und
halluzinieren APIs. Reine Prosa-Anweisungen lösen das nicht — dieses Template
kombiniert drei Mechanismen, die es lösen:

1. **Memory als Dateien** — `memory/CONTEXT.md` (aktueller Stand, hartes
   80-Zeilen-Budget), ADRs in `memory/decisions/`, `conventions.md`,
   `glossary.md`. Wird zu Task-Beginn gelesen und an definierten Momenten
   geschrieben (Protokoll im AGENTS.md).
2. **Spec-getriebener Workflow** — jede nicht-triviale Aufgabe beginnt als
   Spec mit prüfbaren Akzeptanzkriterien und Test-Cases (vor dem Code
   entworfen), wird Schritt für Schritt abgearbeitet und endet mit einem
   Abnahme-Durchgang.
3. **Erzwungene Gates** — `pnpm verify` (typecheck + lint + test) ist die
   Definition of Done. Ein Script, kein Vorschlag; ein Claude-Code-Hook
   führt es automatisch aus.

Anti-Halluzination ist Regel Null: nichts wird importiert, aufgerufen oder
referenziert, ohne vorher seine Existenz zu prüfen
(`rules/00-verification.md`).

## Schnellstart

```bash
# Neues Projekt
npm create agentik@latest meine-app

# Oder in ein bestehendes Projekt integrieren
cd mein-projekt
npm create agentik@latest add

# Danach mit deinem Agenten öffnen und initialisieren
/init-foundation  # Claude Code — in anderen Tools einfach "init" sagen
```

Die CLI erkennt bei bestehenden Projekten Stack, Paketmanager und vorhandene
Quality-Gates. Das gewählte **Profil** (`web-frontend`, `fullstack`, `generic`)
aktiviert die passenden Rules und Skills und parkt den Rest reversibel in
`.agentik/disabled/`. Danach:

```
/write-spec User-Login bauen      # Agent plant, du gibst frei
/execute-spec specs/2026-...md    # Agent baut, hakt ab, verifiziert
/sync-memory                      # Memory-Update am Session-Ende
```

Codex und andere Tools folgen demselben Workflow über das AGENTS.md — die
Slash Commands sind Komfort, keine Voraussetzung.

## Sicher aktualisieren

Spätere Framework-Versionen lassen sich prüfen und übernehmen, ohne
Projektwissen oder eigene Erweiterungen zu überschreiben:

```bash
npm create agentik@latest update -- --dry-run
npm create agentik@latest update
npm create agentik@latest update -- --layout compact  # alte Installationen umziehen
```

Erhalten bleiben unter anderem Memory, Specs, `rules/custom/`, eigene Skills,
Konfiguration, package.json und der Anwendungscode.

## Aufbau

Neue CLI-Installationen nutzen das kompakte Layout. `AGENTS.md` bleibt im
Root, weil Agenten es dort automatisch finden; die Datei ist nur ein kleiner
Verweis auf die eigentlichen Framework-Dateien.

```
AGENTS.md              Root-Bridge für AGENTS.md-kompatible Tools
CLAUDE.md              Root-Bridge für Claude Code
.agentik/AGENTS.md     Single Source of Truth
.agentik/framework.config.json
.agentik/claude/       Commands, Settings und Skills
.agentik/cursor/       Cursor-Regelspiegel
.agentik/rules/        verbindliche Standards (+ rules/custom/)
.agentik/disabled/     geparkte Module
.agentik/specs/        Task-Specs und Archiv
.agentik/memory/       CONTEXT.md · domain.md · decisions/ · conventions.md · glossary.md
.agentik/profiles/     web-frontend / fullstack / generic
.agentik/scripts/      Quality-Gates und Framework-Check
.agentik/docs/         Orchestrierung, MCP-Leitfaden, Adoption
```

## Designprinzipien

- **Eine Quelle der Wahrheit.** AGENTS.md ≤ ~150 Zeilen, imperativ, Commands
  zuerst; Details liegen in Skills/Rules und werden bei Bedarf geladen.
  Lange Kontextdateien verschlechtern messbar die Agenten-Leistung.
- **Prüfbar statt vage.** „`pnpm test` läuft grün" schlägt „sauberer Code" —
  überall: Rules, Specs, Memory.
- **Erzwingen statt hoffen.** Wichtige Regeln existieren doppelt: als Text
  und als ausführbarer Check (verify-Script, Hooks).
- **Modularer Stack.** Der Kern ist stack-agnostisch; React/Next.js liegt
  in einem reversibel aktivierbaren Profil.

Adoption in Bestandsprojekten und Pflege: `docs/adopting.md`.

## Lizenz

MIT — siehe [LICENSE](LICENSE). Vor Veröffentlichung eigenen Namen eintragen.
