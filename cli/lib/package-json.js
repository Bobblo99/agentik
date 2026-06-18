import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function packageIndent(raw) {
  const indentMatch = raw.match(/\n([\t ]+)\S/);
  return indentMatch ? indentMatch[1] : 2;
}

export function packageTrailingNewline(raw) {
  return raw.endsWith('\n') ? '\n' : '';
}

export async function readCliVersion() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

/**
 * Add Agentik as a local project tool without clobbering existing scripts.
 * @param {string} targetDir
 * @param {'classic'|'compact'} layout
 * @param {boolean} [dryRun]
 * @returns {Promise<{changed:boolean,scriptsAdded:string[],devDependencyAdded:boolean}>}
 */
export async function ensureAgentikPackageTooling(targetDir, layout, dryRun = false) {
  const pkgPath = join(targetDir, 'package.json');
  if (!existsSync(pkgPath)) return { changed: false, scriptsAdded: [], devDependencyAdded: false };

  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  pkg.scripts = pkg.scripts || {};
  pkg.devDependencies = pkg.devDependencies || {};

  const scriptsAdded = [];
  const ensureScript = (name, value) => {
    if (!(name in pkg.scripts)) {
      pkg.scripts[name] = value;
      scriptsAdded.push(name);
    }
  };

  ensureScript('agentik', 'agentik');
  ensureScript('agentik:update', `agentik update${layout === 'compact' ? ' --layout compact' : ''}`);
  ensureScript('agentik:check', 'agentik check');

  const version = await readCliVersion();
  const devDependencyAdded = !('create-agentik' in pkg.devDependencies);
  if (devDependencyAdded) {
    pkg.devDependencies['create-agentik'] = `^${version}`;
  }

  const changed = scriptsAdded.length > 0 || devDependencyAdded;
  if (changed && !dryRun) {
    await writeFile(pkgPath, JSON.stringify(pkg, null, packageIndent(raw)) + packageTrailingNewline(raw));
  }
  return { changed, scriptsAdded, devDependencyAdded };
}
