// Smart detection — inspect an existing project and propose the best-fitting
// setup (profile, package manager, TypeScript, real gate commands), with
// human-readable reasons. The CLI shows this and asks the user to confirm.
// Everything here is deterministic (files + package.json), no guessing.

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

export function detectPackageManager(dir, pkg) {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'bun.lockb'))) return 'bun';
  if (existsSync(join(dir, 'package-lock.json'))) return 'npm';
  const pm = pkg?.packageManager; // corepack field, e.g. "pnpm@9.0.0"
  if (typeof pm === 'string') return pm.split('@')[0] ?? null;
  return pkg ? 'npm' : null;
}

// Real gate commands inferred from installed tooling, or null (→ caller stubs).
function detectGates(dir, pkg) {
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
 * @returns {{profile:string, packageManager:string|null, typescript:boolean,
 *   gates:{typecheck:string|null,lint:string|null,test:string|null},
 *   signals:string[], warnings:string[]}}
 */
export function detect(targetDir) {
  const pkg = readPkg(targetDir);
  const d = deps(pkg);
  const profile = detectProfile(pkg);
  const packageManager = detectPackageManager(targetDir, pkg);
  const typescript = 'typescript' in d || existsSync(join(targetDir, 'tsconfig.json'));
  const gates = detectGates(targetDir, pkg);

  const signals = [];
  if ('next' in d) signals.push('Next.js');
  else if ('react' in d) signals.push('React');
  if (['express', 'fastify', '@nestjs/core'].some((x) => x in d)) signals.push('Node API');
  if ('prisma' in d || '@prisma/client' in d) signals.push('Prisma');
  if ('drizzle-orm' in d) signals.push('Drizzle');
  if (typescript) signals.push('TypeScript');
  if (gates.test) signals.push(gates.test.split(' ')[0]); // vitest/jest/mocha
  if (gates.lint) signals.push('ESLint');
  if (packageManager) signals.push(packageManager);
  if (!pkg) signals.push('no package.json');

  const warnings = [];
  if (existsSync(join(targetDir, 'AGENTS.md')))
    warnings.push('AGENTS.md already exists — will be kept (skipped)');
  if (existsSync(join(targetDir, 'framework.config.json')))
    warnings.push('already initialized — only missing files will be added');

  return { profile, packageManager, typescript, gates, signals, warnings };
}
