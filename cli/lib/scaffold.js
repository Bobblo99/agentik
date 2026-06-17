// Dependency-free scaffolding core. Copies the bundled clean template into the
// target dir, applies the chosen profile by PARKING the modules it disables
// (lossless, same model as the `configure` skill), writes framework.config.json,
// stamps the project name, and optionally inits git. No external deps so it is
// trivially testable and runnable in CI.

import { cp, mkdir, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PROFILES } from './profiles.js';
import {
  bridgeClaude,
  configPath,
  moveIfExists,
  normalizeLayout,
  paths,
  writeCompactBridges,
} from './layout.js';

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
  const layout = existsSync(configPath(targetDir, 'compact')) ? 'compact' : 'classic';
  const p = paths(targetDir, layout);

  for (const r of disableRules) {
    const rule = join(p.rules, `${r}.md`);
    if (existsSync(rule)) await moveInto(rule, join(p.disabled, 'rules'));
    const mirror = join(p.cursorRules, `${r}.mdc`);
    if (existsSync(mirror)) await moveInto(mirror, join(p.disabled, 'cursor'));
  }
  for (const s of disableSkills) {
    const skill = join(p.skills, s);
    if (existsSync(skill)) {
      const dest = join(p.disabled, 'skills', s);
      await mkdir(dirname(dest), { recursive: true });
      await rename(skill, dest);
    }
  }
  if (disableRules.length || disableSkills.length) {
    log(`parked ${disableRules.length} rule(s) + ${disableSkills.length} skill(s)`);
  }

  const cfgPath = p.config;
  const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
  cfg.layout = layout;
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
  if (layout === 'compact') {
    await patch(
      join(targetDir, '.agentik', 'AGENTS.md'),
      /<!-- ACTIVE_PROFILE:[^>]*-->/,
      `<!-- ACTIVE_PROFILE: ${profile} (scaffolded ${today}) -->`,
    );
  }

  return { disabledRules: disableRules, disabledSkills: disableSkills };
}

async function makeCompact(targetDir) {
  const p = paths(targetDir, 'compact');
  await mkdir(p.base, { recursive: true });

  const moves = [
    ['rules', 'rules'],
    ['memory', 'memory'],
    ['specs', 'specs'],
    ['profiles', 'profiles'],
    ['scripts', 'scripts'],
    ['docs', 'docs'],
    ['.claude/commands', 'claude/commands'],
    ['.claude/skills', 'claude/skills'],
    ['.claude/settings.json', 'claude/settings.json'],
    ['.cursor/rules', 'cursor/rules'],
    ['.framework/disabled', 'disabled'],
    ['framework.config.json', 'framework.config.json'],
    ['.env.example', '.env.example'],
    ['.mcp.json.example', '.mcp.json.example'],
  ];

  await moveIfExists(join(targetDir, 'AGENTS.md'), join(p.base, 'AGENTS.md'));
  await moveIfExists(join(targetDir, 'CLAUDE.md'), join(p.base, 'CLAUDE.md'));
  for (const [source, destination] of moves) {
    await moveIfExists(join(targetDir, source), join(p.base, destination));
  }

  await rm(join(targetDir, '.claude'), { recursive: true, force: true });
  await rm(join(targetDir, '.cursor'), { recursive: true, force: true });
  await rm(join(targetDir, '.framework'), { recursive: true, force: true });

  const cfg = JSON.parse(await readFile(p.config, 'utf8'));
  cfg.layout = 'compact';
  await writeFile(p.config, JSON.stringify(cfg, null, 2) + '\n');

  await writeCompactBridges(targetDir);
  if (!existsSync(join(p.base, 'CLAUDE.md'))) await writeFile(join(p.base, 'CLAUDE.md'), bridgeClaude());

  await patch(
    join(targetDir, 'package.json'),
    /bash scripts\/verify\.sh/g,
    'bash .agentik/scripts/verify.sh',
  );
  await patch(
    join(targetDir, 'package.json'),
    /bash scripts\/check-framework\.sh/g,
    'bash .agentik/scripts/check-framework.sh',
  );
}

/**
 * @param {object} opts
 * @param {string} opts.targetDir   absolute or relative path to scaffold into
 * @param {string} opts.profile     web-frontend | fullstack | generic
 * @param {string} opts.name        project name
 * @param {boolean} [opts.git]      run `git init` (default true)
 * @param {boolean} [opts.force]    allow non-empty target
 * @param {'classic'|'compact'} [opts.layout] layout to generate
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
  const layout = normalizeLayout(opts.layout);

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
  if (layout === 'compact') {
    await makeCompact(targetDir);
    log('arranged compact layout → .agentik/');
  }

  // Park disabled modules + write config + stamp profile.
  const applied = await applyProfile(targetDir, profile, log);

  // Stamp project name. First H1 in AGENTS.md is the framework title; leave it.
  // Name goes into CONTEXT.md and README so humans/agents see it.
  await patch(
    join(targetDir, 'memory', 'CONTEXT.md'),
    /<1–2 sentences — filled by init-foundation\.>/,
    `${name} — set up with Agentik (${profile}). Run /init-foundation to finish.`,
  );
  await patch(
    join(targetDir, '.agentik', 'memory', 'CONTEXT.md'),
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
