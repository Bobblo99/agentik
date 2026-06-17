// `update` mode — refresh framework-owned files in an adopted project while
// preserving project memory, specs, custom rules/skills, configuration, and
// application code.

import { mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { TEMPLATE_DIR } from './scaffold.js';
import { detect, pmRunner } from './detect.js';
import {
  configPath,
  displayLayoutPath,
  moveIfExists,
  normalizeLayout,
  paths,
  writeCompactBridges,
} from './layout.js';

const STATIC_FILES = ['AGENTS.md', 'CLAUDE.md'];
const STATIC_TREES = ['.claude/commands', 'profiles', 'scripts', 'docs'];

async function listFiles(root) {
  if (!existsSync(root)) return [];
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await listFiles(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

async function readConfig(targetDir) {
  const cfgPath = configPath(targetDir);
  if (!existsSync(cfgPath)) {
    throw new Error(
      `No framework.config.json found in ${targetDir}. Run "npm create agentik@latest add" first.`,
    );
  }
  try {
    const config = JSON.parse(await readFile(cfgPath, 'utf8'));
    if (!config.rules || !config.skills) throw new Error('missing rules or skills');
    config.layout = normalizeLayout(
      config.layout,
      existsSync(join(targetDir, '.agentik')) ? 'compact' : 'classic',
    );
    return config;
  } catch (error) {
    throw new Error(`Cannot update: framework.config.json is invalid (${error.message}).`, {
      cause: error,
    });
  }
}

function activeProfileMarker(text) {
  return text.match(/<!-- ACTIVE_PROFILE:[^>]*-->/)?.[0] ?? null;
}

function existingRunner(text) {
  return text.match(/\b(?:pnpm run --if-present|npm run --if-present|yarn run|bun run)\b/)?.[0] ?? null;
}

function displayPath(from, to) {
  return relative(from, to).split(sep).join('/');
}

function transformContent(relativePath, source, context) {
  let text = source.toString('utf8');
  if (relativePath === 'AGENTS.md' && context.profileMarker) {
    text = text.replace(/<!-- ACTIVE_PROFILE:[^>]*-->/, context.profileMarker);
  }
  if (relativePath === 'scripts/verify.sh' && context.runner) {
    text = text.replace(/pnpm run --if-present/g, context.runner);
  }
  return Buffer.from(text);
}

async function syncFile(sourcePath, destinationPath, relativePath, context, stats) {
  const source = transformContent(relativePath, await readFile(sourcePath), context);
  const current = existsSync(destinationPath) ? await readFile(destinationPath) : null;
  if (current?.equals(source)) {
    stats.unchanged++;
    return;
  }
  stats.updated++;
  stats.files.push(displayPath(context.targetDir, destinationPath));
  if (context.dryRun) return;
  await mkdir(dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, source);
}

async function syncTree(templateDir, targetDir, tree, context, stats) {
  const sourceRoot = join(templateDir, tree);
  for (const sourcePath of await listFiles(sourceRoot)) {
    const child = relative(sourceRoot, sourcePath);
    const destinationPath = join(
      targetDir,
      displayLayoutPath(`${tree}/${child.split(sep).join('/')}`, context.layout),
    );
    await syncFile(sourcePath, destinationPath, `${tree}/${child.split(sep).join('/')}`, context, stats);
  }
}

async function syncConfiguredModules(templateDir, targetDir, config, context, stats) {
  for (const [name, enabled] of Object.entries(config.rules)) {
    const sourceRule = join(templateDir, 'rules', `${name}.md`);
    if (existsSync(sourceRule)) {
      const p = paths(targetDir, context.layout);
      const destinationRule = enabled ? join(p.rules, `${name}.md`) : join(p.disabled, 'rules', `${name}.md`);
      await syncFile(sourceRule, destinationRule, `rules/${name}.md`, context, stats);
    }

    const sourceMirror = join(templateDir, '.cursor', 'rules', `${name}.mdc`);
    if (existsSync(sourceMirror)) {
      const p = paths(targetDir, context.layout);
      const destinationMirror = enabled
        ? join(p.cursorRules, `${name}.mdc`)
        : join(p.disabled, 'cursor', `${name}.mdc`);
      await syncFile(sourceMirror, destinationMirror, `.cursor/rules/${name}.mdc`, context, stats);
    }
  }

  for (const [name, enabled] of Object.entries(config.skills)) {
    const sourceRoot = join(templateDir, '.claude', 'skills', name);
    for (const sourcePath of await listFiles(sourceRoot)) {
      const child = relative(sourceRoot, sourcePath);
      const p = paths(targetDir, context.layout);
      const destinationRoot = enabled ? join(p.skills, name) : join(p.disabled, 'skills', name);
      await syncFile(
        sourcePath,
        join(destinationRoot, child),
        `.claude/skills/${name}/${child}`,
        context,
        stats,
      );
    }
  }
}

async function patchPackageScripts(targetDir, dryRun) {
  const pkgPath = join(targetDir, 'package.json');
  if (!existsSync(pkgPath)) return false;
  const raw = await readFile(pkgPath, 'utf8');
  const next = raw
    .replace(/bash scripts\/verify\.sh/g, 'bash .agentik/scripts/verify.sh')
    .replace(/bash scripts\/check-framework\.sh/g, 'bash .agentik/scripts/check-framework.sh');
  if (next === raw) return false;
  if (!dryRun) await writeFile(pkgPath, next);
  return true;
}

async function migrateClassicToCompact(targetDir, dryRun = false) {
  if (existsSync(configPath(targetDir, 'compact'))) return { migrated: false, files: [] };
  if (!existsSync(configPath(targetDir, 'classic'))) {
    throw new Error(`Cannot migrate: classic framework.config.json is missing.`);
  }

  const compactRoot = join(targetDir, '.agentik');
  if (existsSync(compactRoot) && (await readdir(compactRoot)).length > 0) {
    throw new Error('Cannot migrate to compact layout: .agentik/ already exists and is not empty.');
  }

  const moves = [
    ['AGENTS.md', '.agentik/AGENTS.md'],
    ['CLAUDE.md', '.agentik/CLAUDE.md'],
    ['rules', '.agentik/rules'],
    ['memory', '.agentik/memory'],
    ['specs', '.agentik/specs'],
    ['profiles', '.agentik/profiles'],
    ['scripts', '.agentik/scripts'],
    ['docs', '.agentik/docs'],
    ['framework.config.json', '.agentik/framework.config.json'],
    ['.env.example', '.agentik/.env.example'],
    ['.mcp.json.example', '.agentik/.mcp.json.example'],
    ['.claude/commands', '.agentik/claude/commands'],
    ['.claude/skills', '.agentik/claude/skills'],
    ['.claude/settings.json', '.agentik/claude/settings.json'],
    ['.cursor/rules', '.agentik/cursor/rules'],
    ['.framework/disabled', '.agentik/disabled'],
  ];

  for (const [source, destination] of moves) {
    if (existsSync(join(targetDir, source)) && existsSync(join(targetDir, destination))) {
      throw new Error(`Cannot migrate: ${destination} already exists.`);
    }
  }

  const moved = [];
  if (!dryRun) await mkdir(compactRoot, { recursive: true });
  for (const [source, destination] of moves) {
    if (existsSync(join(targetDir, source))) {
      moved.push(destination);
      if (!dryRun) await moveIfExists(join(targetDir, source), join(targetDir, destination));
    }
  }
  if (!dryRun) {
    await rm(join(targetDir, '.claude'), { recursive: true, force: true });
    await rm(join(targetDir, '.cursor'), { recursive: true, force: true });
    await rm(join(targetDir, '.framework'), { recursive: true, force: true });
    const cfgPath = configPath(targetDir, 'compact');
    const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
    cfg.layout = 'compact';
    await writeFile(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    await writeCompactBridges(targetDir);
  }
  if (await patchPackageScripts(targetDir, dryRun)) moved.push('package.json');
  return { migrated: true, files: moved };
}

/**
 * @param {object} opts
 * @param {string} opts.targetDir
 * @param {boolean} [opts.dryRun]
 * @param {'classic'|'compact'} [opts.layout]
 * @param {string} [opts.templateDir]
 * @param {(message?: string) => void} [opts.log]
 * @returns {Promise<{updated:number,unchanged:number,files:string[],dryRun:boolean,packageManager:string|null,layout:'classic'|'compact',migrated:boolean}>}
 */
export async function updateInto(opts) {
  const { targetDir, dryRun = false, templateDir = TEMPLATE_DIR, log = () => {} } = opts;
  if (!existsSync(targetDir)) throw new Error(`Target ${targetDir} does not exist.`);
  if (!existsSync(templateDir)) throw new Error(`Template not found at ${templateDir}. Build it first.`);

  const requestedLayout = opts.layout ? normalizeLayout(opts.layout) : null;
  const migration =
    requestedLayout === 'compact'
      ? await migrateClassicToCompact(targetDir, dryRun)
      : { migrated: false, files: [] };

  const config = await readConfig(targetDir);
  const layout = config.layout;
  const p = paths(targetDir, layout);
  const targetAgents = p.agents;
  const profileMarker = existsSync(targetAgents)
    ? activeProfileMarker(await readFile(targetAgents, 'utf8'))
    : null;
  const packageManager = detect(targetDir).packageManager;
  const verifyPath = join(p.scripts, 'verify.sh');
  const runner = existsSync(verifyPath)
    ? existingRunner(await readFile(verifyPath, 'utf8'))
    : pmRunner(packageManager);
  const context = { dryRun, profileMarker, runner, targetDir, layout };
  const stats = { updated: 0, unchanged: 0, files: [...migration.files] };

  for (const file of STATIC_FILES) {
    const sourcePath = join(templateDir, file);
    if (existsSync(sourcePath)) {
      await syncFile(sourcePath, join(targetDir, displayLayoutPath(file, layout)), file, context, stats);
    }
  }
  for (const tree of STATIC_TREES) {
    await syncTree(templateDir, targetDir, tree, context, stats);
  }
  await syncConfiguredModules(templateDir, targetDir, config, context, stats);
  if (layout === 'compact' && !dryRun) await writeCompactBridges(targetDir);

  log(
    `${dryRun ? 'would update' : 'updated'} ${stats.updated} framework file(s); ` +
      `${stats.unchanged} already current`,
  );
  return { ...stats, dryRun, packageManager, layout, migrated: migration.migrated };
}
