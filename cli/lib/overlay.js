// `add` mode — drop the framework into an EXISTING project without touching the
// developer's code. Copies only framework-owned paths, never overwrites an
// existing file (unless --force), merges gate scripts into package.json, and
// applies the chosen profile. The full config system comes along unchanged.

import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { applyProfile, TEMPLATE_DIR } from './scaffold.js';
import { PROFILES, PROFILE_NAMES } from './profiles.js';
import { detect, detectProfile, pmRunner } from './detect.js';

// Re-exported for the CLI/tests (detection lives in detect.js now).
export { detectProfile, detect };

// Framework-owned, relative to the template root. Never includes the user's
// own files (package.json, README*, LICENSE, src/, …).
export const OVERLAY = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude',
  '.cursor',
  'rules',
  'memory',
  'specs',
  'profiles',
  'scripts',
  'framework.config.json',
  '.framework',
  'docs',
  '.env.example',
  '.mcp.json.example',
];

// Recursively copy src→dest, skipping any file that already exists (unless
// force). Mutates `stats` { copied, skipped }.
async function copyMerge(src, dest, force, stats, dryRun) {
  const entries = await readdir(src, { withFileTypes: true });
  if (!dryRun) await mkdir(dest, { recursive: true });
  for (const e of entries) {
    const s = join(src, e.name);
    const d = join(dest, e.name);
    if (e.isDirectory()) {
      await copyMerge(s, d, force, stats, dryRun);
    } else if (existsSync(d) && !force) {
      stats.skipped.push(d);
    } else {
      if (!dryRun) await cp(s, d);
      stats.copied++;
    }
  }
}

const STUB = (cmd) => `echo '[stub] init-foundation replaces this with e.g. ${cmd}'`;

// Add the gate scripts to an existing package.json. Uses REAL commands the
// detector inferred (vitest/jest, eslint, tsc) and falls back to a stub.
// Never clobbers a script the user already defined. Returns the scripts added.
async function mergeScripts(pkgPath, gates = {}, dryRun = false) {
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  pkg.scripts = pkg.scripts || {};
  /** @type {string[]} */
  const added = [];
  const ensure = (name, value) => {
    if (!(name in pkg.scripts)) {
      pkg.scripts[name] = value;
      added.push(name);
    }
  };
  ensure('verify', 'bash scripts/verify.sh');
  ensure('check:framework', 'bash scripts/check-framework.sh');
  ensure('typecheck', gates.typecheck || STUB('tsc --noEmit'));
  ensure('lint', gates.lint || STUB('eslint .'));
  ensure('test', gates.test || STUB('vitest run'));
  // Preserve the file's existing indentation (tabs or N spaces) and trailing newline.
  const indentMatch = raw.match(/\n([\t ]+)\S/);
  const indent = indentMatch ? indentMatch[1] : 2;
  const trailingNewline = raw.endsWith('\n') ? '\n' : '';
  if (added.length && !dryRun) await writeFile(pkgPath, JSON.stringify(pkg, null, indent) + trailingNewline);
  return added;
}

// Point verify.sh at the project's package manager (it ships pnpm-based).
// Returns true if an adaptation is needed/applied.
async function adaptRunner(targetDir, packageManager, dryRun = false) {
  if (!packageManager || packageManager === 'pnpm') return false;
  const f = join(targetDir, 'scripts', 'verify.sh');
  if (!existsSync(f)) return false;
  const text = await readFile(f, 'utf8');
  const next = text.replace(/pnpm run --if-present/g, pmRunner(packageManager));
  if (next === text) return false;
  if (!dryRun) await writeFile(f, next);
  return true;
}

/**
 * @param {object} opts
 * @param {string} opts.targetDir   existing project dir
 * @param {string} [opts.profile]   override; default from stack detection
 * @param {boolean} [opts.force]    overwrite existing files
 * @param {boolean} [opts.dryRun]   compute the plan, write nothing
 * @param {ReturnType<import('./detect.js').detect>} [opts.detected]  precomputed proposal
 * @param {string} [opts.templateDir]
 * @param {(m?: string) => void} [opts.log]
 */
export async function addInto(opts) {
  const { targetDir, force = false, dryRun = false, templateDir = TEMPLATE_DIR, log = () => {} } = opts;
  if (!existsSync(templateDir)) throw new Error(`Template not found at ${templateDir}. Build it first.`);
  if (!existsSync(targetDir)) throw new Error(`Target ${targetDir} does not exist.`);

  const proposal = opts.detected || detect(targetDir);
  const pkgPath = join(targetDir, 'package.json');
  const hasPkg = existsSync(pkgPath);
  const profile = opts.profile || proposal.profile;
  if (!PROFILES[profile])
    throw new Error(`Unknown profile "${profile}". Choose: ${PROFILE_NAMES.join(', ')}`);

  const alreadyInit = existsSync(join(targetDir, 'framework.config.json'));
  /** @type {{ copied: number, skipped: string[] }} */
  const stats = { copied: 0, skipped: [] };

  const topEntries = await readdir(templateDir, { withFileTypes: true });
  for (const entry of OVERLAY) {
    const src = join(templateDir, entry);
    if (!existsSync(src)) continue;
    const dest = join(targetDir, entry);
    const isDir = topEntries.find((e) => e.name === entry)?.isDirectory();
    if (isDir) {
      await copyMerge(src, dest, force, stats, dryRun);
    } else if (existsSync(dest) && !force) {
      stats.skipped.push(dest);
    } else {
      if (!dryRun) {
        await mkdir(dirname(dest), { recursive: true });
        await cp(src, dest);
      }
      stats.copied++;
    }
  }
  log(
    `${dryRun ? 'would copy' : 'copied'} ${stats.copied} framework file(s); skipped ${stats.skipped.length} existing`,
  );

  /** @type {{ disabledRules: string[], disabledSkills: string[] }} */
  let applied = { disabledRules: [], disabledSkills: [] };
  /** @type {string[]} */
  let scriptsAdded = [];
  let pmAdapted = false;
  if (alreadyInit) {
    log(
      'framework.config.json already present — filling missing files only; use /configure to change profile',
    );
  } else if (dryRun) {
    // Report intent without writing.
    applied = {
      disabledRules: PROFILES[profile].disableRules,
      disabledSkills: PROFILES[profile].disableSkills,
    };
    if (hasPkg) {
      scriptsAdded = await mergeScripts(pkgPath, proposal.gates, true);
      pmAdapted = await adaptRunner(targetDir, proposal.packageManager, true);
    }
  } else {
    applied = await applyProfile(targetDir, profile, log);
    if (hasPkg) {
      scriptsAdded = await mergeScripts(pkgPath, proposal.gates);
      pmAdapted = await adaptRunner(targetDir, proposal.packageManager);
      if (scriptsAdded.length) log(`added package.json scripts: ${scriptsAdded.join(', ')}`);
    } else {
      const g = proposal.gates || {};
      const wired = [
        g.typecheck && `typecheck: ${g.typecheck}`,
        g.lint && `lint: ${g.lint}`,
        g.test && `test: ${g.test}`,
      ].filter(Boolean);
      if (wired.length) {
        log(`no package.json (${proposal.language}) — wire these detected gates into scripts/verify.sh:`);
        wired.forEach((w) => log(`    ${w}`));
      } else {
        log("no package.json — set your stack's gate commands in scripts/verify.sh (generic profile)");
      }
    }
  }

  return {
    profile,
    language: proposal.language,
    alreadyInit,
    dryRun,
    copied: stats.copied,
    skipped: stats.skipped,
    scriptsAdded,
    pmAdapted,
    packageManager: proposal.packageManager,
    gates: proposal.gates,
    ...applied,
  };
}
