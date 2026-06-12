#!/usr/bin/env node
// Snapshot the repo root into cli/template/ as a CLEAN, adopter-ready template.
// Runs at `prepack` so the published npm package bundles it. Excludes the CLI
// itself and dev artifacts; resets per-project state to placeholders.

import { cp, rm, mkdir, mkdtemp, readdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(cliDir, '..');
const dest = join(cliDir, 'template');

// Top-level paths never copied into the template (CLI, vcs, deps, dev-only docs).
const DENY_TOP = new Set([
  'cli',
  'node_modules',
  '.git',
  '.agents',
  '.codex',
  '.github',
  '.DS_Store',
  'pnpm-lock.yaml',
  'package-lock.json',
  'DEVELOPMENT.md',
]);
// Files anywhere that should be dropped.
const DENY_LEAF = new Set(['.DS_Store', 'settings.local.json']);

function included(srcPath) {
  const relPath = relative(repoRoot, srcPath);
  if (relPath === '') return true;
  const parts = relPath.split(sep);
  if (DENY_TOP.has(parts[0])) return false;
  if (DENY_LEAF.has(parts[parts.length - 1])) return false;
  return true;
}

async function emptyExceptGitkeep(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  } else {
    for (const e of await readdir(dir)) {
      if (e !== '.gitkeep') await rm(join(dir, e), { recursive: true, force: true });
    }
  }
  await writeFile(join(dir, '.gitkeep'), '');
}

async function patchFile(file, pattern, replacement) {
  if (!existsSync(file)) return;
  const text = await readFile(file, 'utf8');
  await writeFile(file, text.replace(pattern, replacement));
}

// node's cp refuses to copy a dir into its own subdirectory, so stage in a temp
// dir outside the repo, clean it, then move it into place.
const stage = await mkdtemp(join(tmpdir(), 'caf-build-'));
await cp(repoRoot, stage, { recursive: true, filter: (src) => included(src) });
await rm(dest, { recursive: true, force: true });
await cp(stage, dest, { recursive: true });
await rm(stage, { recursive: true, force: true });

// Reset per-project state to a pristine, uninitialized template.
await emptyExceptGitkeep(join(dest, 'specs', 'archive'));
await emptyExceptGitkeep(join(dest, '.framework', 'disabled'));
for (const entry of await readdir(join(dest, 'specs'))) {
  if (entry !== 'TEMPLATE.md' && entry !== 'archive') {
    await rm(join(dest, 'specs', entry), { recursive: true, force: true });
  }
}

// All-active config, no profile.
const cfgPath = join(dest, 'framework.config.json');
const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
cfg.profile = null;
for (const k of Object.keys(cfg.rules)) cfg.rules[k] = true;
for (const k of Object.keys(cfg.skills)) cfg.skills[k] = true;
await writeFile(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

// Uninitialized profile marker.
await patchFile(
  join(dest, 'AGENTS.md'),
  /<!-- ACTIVE_PROFILE:[^>]*-->/,
  '<!-- ACTIVE_PROFILE: none — run the init-foundation skill (or /init-foundation) first -->',
);

// Sanity: the snapshot must not contain the CLI or node_modules.
for (const banned of ['cli', 'node_modules', '.agents', '.codex', '.github']) {
  if (existsSync(join(dest, banned))) {
    console.error(`✗ snapshot leaked ${banned}/`);
    process.exit(1);
  }
}

const count = (await readdir(dest)).length;
console.log(`✓ clean template snapshot → ${relative(repoRoot, dest)} (${count} top-level entries)`);
