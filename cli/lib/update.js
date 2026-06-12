// `update` mode — refresh framework-owned files in an adopted project while
// preserving project memory, specs, custom rules/skills, configuration, and
// application code.

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { TEMPLATE_DIR } from './scaffold.js';
import { detect, pmRunner } from './detect.js';

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
  const configPath = join(targetDir, 'framework.config.json');
  if (!existsSync(configPath)) {
    throw new Error(
      `No framework.config.json found in ${targetDir}. Run "npm create agentik@latest add" first.`,
    );
  }
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    if (!config.rules || !config.skills) throw new Error('missing rules or skills');
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
    const destinationPath = join(targetDir, tree, child);
    await syncFile(sourcePath, destinationPath, `${tree}/${child.split(sep).join('/')}`, context, stats);
  }
}

async function syncConfiguredModules(templateDir, targetDir, config, context, stats) {
  for (const [name, enabled] of Object.entries(config.rules)) {
    const sourceRule = join(templateDir, 'rules', `${name}.md`);
    if (existsSync(sourceRule)) {
      const destinationRule = enabled
        ? join(targetDir, 'rules', `${name}.md`)
        : join(targetDir, '.framework', 'disabled', 'rules', `${name}.md`);
      await syncFile(sourceRule, destinationRule, `rules/${name}.md`, context, stats);
    }

    const sourceMirror = join(templateDir, '.cursor', 'rules', `${name}.mdc`);
    if (existsSync(sourceMirror)) {
      const destinationMirror = enabled
        ? join(targetDir, '.cursor', 'rules', `${name}.mdc`)
        : join(targetDir, '.framework', 'disabled', 'cursor', `${name}.mdc`);
      await syncFile(sourceMirror, destinationMirror, `.cursor/rules/${name}.mdc`, context, stats);
    }
  }

  for (const [name, enabled] of Object.entries(config.skills)) {
    const sourceRoot = join(templateDir, '.claude', 'skills', name);
    for (const sourcePath of await listFiles(sourceRoot)) {
      const child = relative(sourceRoot, sourcePath);
      const destinationRoot = enabled
        ? join(targetDir, '.claude', 'skills', name)
        : join(targetDir, '.framework', 'disabled', 'skills', name);
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

/**
 * @param {object} opts
 * @param {string} opts.targetDir
 * @param {boolean} [opts.dryRun]
 * @param {string} [opts.templateDir]
 * @param {(message?: string) => void} [opts.log]
 * @returns {Promise<{updated:number,unchanged:number,files:string[],dryRun:boolean,packageManager:string|null}>}
 */
export async function updateInto(opts) {
  const { targetDir, dryRun = false, templateDir = TEMPLATE_DIR, log = () => {} } = opts;
  if (!existsSync(targetDir)) throw new Error(`Target ${targetDir} does not exist.`);
  if (!existsSync(templateDir)) throw new Error(`Template not found at ${templateDir}. Build it first.`);

  const config = await readConfig(targetDir);
  const targetAgents = join(targetDir, 'AGENTS.md');
  const profileMarker = existsSync(targetAgents)
    ? activeProfileMarker(await readFile(targetAgents, 'utf8'))
    : null;
  const packageManager = detect(targetDir).packageManager;
  const verifyPath = join(targetDir, 'scripts', 'verify.sh');
  const runner = existsSync(verifyPath)
    ? existingRunner(await readFile(verifyPath, 'utf8'))
    : pmRunner(packageManager);
  const context = { dryRun, profileMarker, runner, targetDir };
  const stats = { updated: 0, unchanged: 0, files: [] };

  for (const file of STATIC_FILES) {
    const sourcePath = join(templateDir, file);
    if (existsSync(sourcePath)) {
      await syncFile(sourcePath, join(targetDir, file), file, context, stats);
    }
  }
  for (const tree of STATIC_TREES) {
    await syncTree(templateDir, targetDir, tree, context, stats);
  }
  await syncConfiguredModules(templateDir, targetDir, config, context, stats);

  log(
    `${dryRun ? 'would update' : 'updated'} ${stats.updated} framework file(s); ` +
      `${stats.unchanged} already current`,
  );
  return { ...stats, dryRun, packageManager };
}
