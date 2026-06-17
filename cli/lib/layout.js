import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const LAYOUTS = new Set(['classic', 'compact']);

/**
 * @param {string | undefined | null} layout
 * @param {'classic'|'compact'} [fallback]
 * @returns {'classic'|'compact'}
 */
export function normalizeLayout(layout, fallback = 'classic') {
  const value = layout || fallback;
  if (!LAYOUTS.has(value)) throw new Error(`Unknown layout "${value}". Choose: classic, compact`);
  return /** @type {'classic'|'compact'} */ (value);
}

/**
 * @param {string} targetDir
 * @param {'classic'|'compact'|null} [layout]
 */
export function configPath(targetDir, layout = null) {
  if (layout === 'compact') return join(targetDir, '.agentik', 'framework.config.json');
  if (layout === 'classic') return join(targetDir, 'framework.config.json');
  const compact = join(targetDir, '.agentik', 'framework.config.json');
  return existsSync(compact) ? compact : join(targetDir, 'framework.config.json');
}

export async function readLayout(targetDir) {
  const cfgPath = configPath(targetDir);
  const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
  return normalizeLayout(cfg.layout, existsSync(join(targetDir, '.agentik')) ? 'compact' : 'classic');
}

/**
 * @param {string} targetDir
 * @param {'classic'|'compact'} [layout]
 */
export function paths(targetDir, layout = 'classic') {
  const compact = layout === 'compact';
  const base = compact ? join(targetDir, '.agentik') : targetDir;
  return {
    layout,
    base,
    agents: compact ? join(base, 'AGENTS.md') : join(targetDir, 'AGENTS.md'),
    rootAgents: join(targetDir, 'AGENTS.md'),
    claude: compact ? join(base, 'CLAUDE.md') : join(targetDir, 'CLAUDE.md'),
    rootClaude: join(targetDir, 'CLAUDE.md'),
    config: join(base, 'framework.config.json'),
    rules: join(base, 'rules'),
    cursorRules: compact ? join(base, 'cursor', 'rules') : join(targetDir, '.cursor', 'rules'),
    skills: compact ? join(base, 'claude', 'skills') : join(targetDir, '.claude', 'skills'),
    claudeCommands: compact ? join(base, 'claude', 'commands') : join(targetDir, '.claude', 'commands'),
    claudeSettings: compact
      ? join(base, 'claude', 'settings.json')
      : join(targetDir, '.claude', 'settings.json'),
    disabled: compact ? join(base, 'disabled') : join(targetDir, '.framework', 'disabled'),
    scripts: join(base, 'scripts'),
    docs: join(base, 'docs'),
    profiles: join(base, 'profiles'),
    memory: join(base, 'memory'),
    specs: join(base, 'specs'),
    envExample: compact ? join(base, '.env.example') : join(targetDir, '.env.example'),
    mcpExample: compact ? join(base, '.mcp.json.example') : join(targetDir, '.mcp.json.example'),
  };
}

export function bridgeAgents() {
  return `# AGENTS.md\n\nAgentik is installed in compact layout.\n\nRead and follow [./.agentik/AGENTS.md](./.agentik/AGENTS.md) as the source of truth for this repository.\n`;
}

export function bridgeClaude() {
  return `# CLAUDE.md\n\nRead [./.agentik/AGENTS.md](./.agentik/AGENTS.md). Agentik internals live in [./.agentik/](./.agentik/).\n`;
}

export async function writeCompactBridges(targetDir) {
  await writeFile(join(targetDir, 'AGENTS.md'), bridgeAgents());
  await writeFile(join(targetDir, 'CLAUDE.md'), bridgeClaude());
}

export async function ensureParent(file) {
  await mkdir(dirname(file), { recursive: true });
}

export async function moveIfExists(source, destination) {
  if (!existsSync(source)) return false;
  await ensureParent(destination);
  await rename(source, destination);
  return true;
}

export function displayLayoutPath(relativePath, layout = 'classic') {
  if (layout !== 'compact') return relativePath;
  if (relativePath === 'AGENTS.md' || relativePath === 'CLAUDE.md') return `.agentik/${relativePath}`;
  if (relativePath === 'framework.config.json') return '.agentik/framework.config.json';
  if (relativePath === '.env.example') return '.agentik/.env.example';
  if (relativePath === '.mcp.json.example') return '.agentik/.mcp.json.example';
  if (relativePath === '.claude') return '.agentik/claude';
  if (relativePath === '.cursor') return '.agentik/cursor';
  if (relativePath === '.framework') return '.agentik';
  if (['rules', 'memory', 'specs', 'profiles', 'scripts', 'docs'].includes(relativePath)) {
    return `.agentik/${relativePath}`;
  }
  if (relativePath.startsWith('.claude/')) return `.agentik/claude/${relativePath.slice('.claude/'.length)}`;
  if (relativePath.startsWith('.cursor/')) return `.agentik/cursor/${relativePath.slice('.cursor/'.length)}`;
  if (relativePath.startsWith('.framework/disabled/')) {
    return `.agentik/disabled/${relativePath.slice('.framework/disabled/'.length)}`;
  }
  if (
    relativePath.startsWith('rules/') ||
    relativePath.startsWith('memory/') ||
    relativePath.startsWith('specs/') ||
    relativePath.startsWith('profiles/') ||
    relativePath.startsWith('scripts/') ||
    relativePath.startsWith('docs/')
  ) {
    return `.agentik/${relativePath}`;
  }
  return relativePath;
}
