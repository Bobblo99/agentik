// Smart detection — inspect an existing project and propose the best-fitting
// setup (language, profile, package manager, gates, monorepo, router), with
// human-readable reasons. The CLI shows this and asks the user to confirm.
// Everything here is deterministic (files + manifests), no guessing.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function readPkg(dir) {
  const p = join(dir, 'package.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const deps = (pkg) => ({ ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) });
const has = (dir, ...files) => files.some((f) => existsSync(join(dir, f)));

// Primary language. A package.json means JS/TS tooling, even in a polyglot repo,
// because the framework's gate runner is JS-oriented; non-JS manifests follow.
export function detectLanguage(dir, pkg) {
  if (pkg) return 'node';
  if (has(dir, 'Cargo.toml')) return 'rust';
  if (has(dir, 'go.mod')) return 'go';
  if (has(dir, 'pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile')) return 'python';
  return 'unknown';
}

export function detectProfile(pkg) {
  const d = deps(pkg);
  const hasApi = ['express', 'fastify', '@nestjs/core'].some((x) => x in d);
  const hasDb = ['prisma', '@prisma/client', 'drizzle-orm', 'typeorm', 'mongoose', 'kysely'].some(
    (x) => x in d,
  );
  // Next.js with a DB/API layer is full-stack; a plain Next/React app is web-frontend.
  if ('next' in d) return hasApi || hasDb ? 'fullstack' : 'web-frontend';
  if (hasApi || hasDb) return 'fullstack';
  if ('react' in d) return 'web-frontend';
  return 'generic';
}

export function detectPackageManager(dir, pkg, language = 'node') {
  if (language === 'rust') return 'cargo';
  if (language === 'go') return 'go';
  if (language === 'python') {
    if (has(dir, 'uv.lock')) return 'uv';
    if (has(dir, 'poetry.lock')) return 'poetry';
    if (has(dir, 'Pipfile')) return 'pipenv';
    return 'pip';
  }
  if (language !== 'node') return null;
  if (has(dir, 'pnpm-lock.yaml')) return 'pnpm';
  if (has(dir, 'yarn.lock')) return 'yarn';
  if (has(dir, 'bun.lockb')) return 'bun';
  if (has(dir, 'package-lock.json')) return 'npm';
  const pm = pkg?.packageManager; // corepack field, e.g. "pnpm@9.0.0"
  if (typeof pm === 'string') return pm.split('@')[0] ?? null;
  return pkg ? 'npm' : null;
}

// Real gate commands inferred from the stack, or null (→ caller stubs / asks).
function detectGates(dir, pkg, language) {
  if (language === 'python') return { typecheck: 'mypy .', lint: 'ruff check .', test: 'pytest' };
  if (language === 'rust')
    return { typecheck: 'cargo check', lint: 'cargo clippy -- -D warnings', test: 'cargo test' };
  if (language === 'go') return { typecheck: 'go build ./...', lint: 'go vet ./...', test: 'go test ./...' };
  if (language !== 'node') return { typecheck: null, lint: null, test: null };
  const d = deps(pkg);
  const hasTs = 'typescript' in d || existsSync(join(dir, 'tsconfig.json'));
  let test = null;
  if ('vitest' in d) test = 'vitest run';
  else if ('jest' in d) test = 'jest';
  else if ('mocha' in d) test = 'mocha';
  return {
    typecheck: hasTs ? 'tsc --noEmit' : null,
    lint: 'eslint' in d ? 'eslint .' : null,
    test,
  };
}

function detectMonorepo(dir, pkg) {
  if (has(dir, 'pnpm-workspace.yaml')) return { tool: 'pnpm-workspaces' };
  if (has(dir, 'turbo.json')) return { tool: 'turborepo' };
  if (has(dir, 'lerna.json')) return { tool: 'lerna' };
  if (has(dir, 'nx.json')) return { tool: 'nx' };
  if (pkg?.workspaces) return { tool: 'npm-workspaces' };
  return null;
}

// Next.js router style, when relevant.
function detectRouter(dir) {
  const app = has(dir, 'app', 'src/app');
  const pages = has(dir, 'pages', 'src/pages');
  if (app && pages) return 'mixed';
  if (app) return 'app';
  if (pages) return 'pages';
  return null;
}

const RUNNER = {
  pnpm: 'pnpm run --if-present',
  npm: 'npm run --if-present',
  yarn: 'yarn run',
  bun: 'bun run',
};
export const pmRunner = (pm) => RUNNER[pm] || RUNNER.pnpm;
export const pmExec = (pm) => (pm === 'npm' ? 'npm run' : pm || 'pnpm'); // how a user invokes a script

/**
 * Inspect `targetDir` and return a proposed setup.
 * @returns {{language:string, profile:string, packageManager:string|null,
 *   typescript:boolean, gates:{typecheck:string|null,lint:string|null,test:string|null},
 *   monorepo:{tool:string}|null, router:string|null, signals:string[], warnings:string[]}}
 */
export function detect(targetDir) {
  const pkg = readPkg(targetDir);
  const d = deps(pkg);
  const language = detectLanguage(targetDir, pkg);
  const profile = language === 'node' ? detectProfile(pkg) : 'generic';
  const packageManager = detectPackageManager(targetDir, pkg, language);
  const typescript =
    language === 'node' && ('typescript' in d || existsSync(join(targetDir, 'tsconfig.json')));
  const gates = detectGates(targetDir, pkg, language);
  const monorepo = detectMonorepo(targetDir, pkg);
  const router = language === 'node' && 'next' in d ? detectRouter(targetDir) : null;

  const signals = [];
  if (language !== 'node' && language !== 'unknown')
    signals.push(language[0].toUpperCase() + language.slice(1));
  if ('next' in d) signals.push('Next.js');
  else if ('react' in d) signals.push('React');
  if (['express', 'fastify', '@nestjs/core'].some((x) => x in d)) signals.push('Node API');
  if ('prisma' in d || '@prisma/client' in d) signals.push('Prisma');
  if ('drizzle-orm' in d) signals.push('Drizzle');
  if (typescript) signals.push('TypeScript');
  if (router) signals.push(`${router}-router`);
  if (monorepo) signals.push(monorepo.tool);
  if (gates.test) signals.push(gates.test.split(' ')[0]); // vitest/jest/pytest/cargo/go
  if (language === 'node' && gates.lint) signals.push('ESLint');
  if (packageManager) signals.push(packageManager);
  if (language === 'unknown' && !pkg) signals.push('no recognized manifest');

  const warnings = [];
  if (existsSync(join(targetDir, 'AGENTS.md')))
    warnings.push('AGENTS.md already exists — will be kept (skipped)');
  if (existsSync(join(targetDir, 'framework.config.json')))
    warnings.push('already initialized — only missing files will be added');
  if (monorepo)
    warnings.push(
      `${monorepo.tool} monorepo — install Agentik at the repo root; add it per-package only if packages are developed independently`,
    );

  return {
    language,
    profile,
    packageManager,
    typescript,
    gates,
    monorepo,
    router,
    signals: [...new Set(signals)],
    warnings,
  };
}
