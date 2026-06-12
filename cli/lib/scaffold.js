// Dependency-free scaffolding core. Copies the bundled clean template into the
// target dir, applies the chosen profile by PARKING the modules it disables
// (lossless, same model as the `configure` skill), writes framework.config.json,
// stamps the project name, and optionally inits git. No external deps so it is
// trivially testable and runnable in CI.

import { cp, mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PROFILES } from './profiles.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE_DIR = join(__dirname, '..', 'template');

async function isEmptyDir(dir) {
  if (!existsSync(dir)) return true;
  const entries = await readdir(dir);
  return entries.filter((e) => e !== '.git').length === 0;
}

async function moveInto(src, destDir) {
  await mkdir(destDir, { recursive: true });
  await rename(src, join(destDir, basename(src)));
}

// Replace the first occurrence of `pattern` in a file with `replacement`.
async function patch(file, pattern, replacement) {
  if (!existsSync(file)) return;
  const text = await readFile(file, 'utf8');
  if (!pattern.test(text)) return;
  await writeFile(file, text.replace(pattern, replacement));
}

/**
 * Apply a profile to an already-populated project dir: park the modules the
 * profile disables (lossless), flip their booleans in framework.config.json,
 * set the profile, and stamp the ACTIVE_PROFILE marker. Tolerant of already-
 * parked / missing modules so it is safe to call on greenfield or overlay.
 * @param {string} targetDir
 * @param {string} profile
 * @param {(m?: string) => void} [log]
 * @returns {Promise<{disabledRules:string[],disabledSkills:string[]}>}
 */
export async function applyProfile(targetDir, profile, log = () => {}) {
  if (!PROFILES[profile]) throw new Error(`Unknown profile: ${profile}`);
  const { disableRules, disableSkills } = PROFILES[profile];

  for (const r of disableRules) {
    const rule = join(targetDir, 'rules', `${r}.md`);
    if (existsSync(rule)) await moveInto(rule, join(targetDir, '.framework/disabled/rules'));
    const mirror = join(targetDir, '.cursor/rules', `${r}.mdc`);
    if (existsSync(mirror)) await moveInto(mirror, join(targetDir, '.framework/disabled/cursor'));
  }
  for (const s of disableSkills) {
    const skill = join(targetDir, '.claude/skills', s);
    if (existsSync(skill)) {
      const dest = join(targetDir, '.framework/disabled/skills', s);
      await mkdir(dirname(dest), { recursive: true });
      await rename(skill, dest);
    }
  }
  if (disableRules.length || disableSkills.length) {
    log(`parked ${disableRules.length} rule(s) + ${disableSkills.length} skill(s)`);
  }

  const cfgPath = join(targetDir, 'framework.config.json');
  const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
  cfg.profile = profile;
  for (const r of disableRules) if (r in cfg.rules) cfg.rules[r] = false;
  for (const s of disableSkills) if (s in cfg.skills) cfg.skills[s] = false;
  await writeFile(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

  const today = new Date().toISOString().slice(0, 10);
  await patch(
    join(targetDir, 'AGENTS.md'),
    /<!-- ACTIVE_PROFILE:[^>]*-->/,
    `<!-- ACTIVE_PROFILE: ${profile} (scaffolded ${today}) -->`,
  );

  return { disabledRules: disableRules, disabledSkills: disableSkills };
}

/**
 * @param {object} opts
 * @param {string} opts.targetDir   absolute or relative path to scaffold into
 * @param {string} opts.profile     web-frontend | fullstack | generic
 * @param {string} opts.name        project name
 * @param {boolean} [opts.git]      run `git init` (default true)
 * @param {boolean} [opts.force]    allow non-empty target
 * @param {string} [opts.templateDir] override (tests)
 * @param {(m?: string) => void} [opts.log]
 * @returns {Promise<{disabledRules:string[],disabledSkills:string[]}>}
 */
export async function scaffold(opts) {
  const {
    targetDir,
    profile,
    name,
    git = true,
    force = false,
    templateDir = TEMPLATE_DIR,
    log = () => {},
  } = opts;

  if (!PROFILES[profile]) throw new Error(`Unknown profile: ${profile}`);
  if (!existsSync(templateDir)) {
    throw new Error(`Template not found at ${templateDir}. Run build-template.mjs first.`);
  }
  if (!(await isEmptyDir(targetDir)) && !force) {
    throw new Error(`Target ${targetDir} is not empty. Use --force to scaffold anyway.`);
  }

  await mkdir(targetDir, { recursive: true });
  await cp(templateDir, targetDir, { recursive: true });
  log(`copied template → ${targetDir}`);

  // Park disabled modules + write config + stamp profile.
  const applied = await applyProfile(targetDir, profile, log);

  // Stamp project name. First H1 in AGENTS.md is the framework title; leave it.
  // Name goes into CONTEXT.md and README so humans/agents see it.
  await patch(
    join(targetDir, 'memory', 'CONTEXT.md'),
    /<1–2 sentences — filled by init-foundation\.>/,
    `${name} — set up with Agentik (${profile}). Run /init-foundation to finish.`,
  );
  await patch(join(targetDir, 'README.md'), /^# Agentik$/m, `# ${name}`);
  log('stamped project name + profile');

  if (git) {
    try {
      execFileSync('git', ['init', '-q'], { cwd: targetDir, stdio: 'ignore' });
      log('initialized git repo');
    } catch {
      log('git not available — skipped git init');
    }
  }

  return applied;
}
