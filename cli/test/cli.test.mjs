// Zero-dep tests for the CLI core. Builds the template snapshot (via the
// package `test` script) then scaffolds / adds into temp dirs and asserts the
// structural outcome + config↔filesystem consistency.
// Run: npm test (in cli/), or: node test/cli.test.mjs

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { scaffold } from '../lib/scaffold.js';
import { addInto } from '../lib/overlay.js';
import { updateInto } from '../lib/update.js';
import { detect, detectProfile } from '../lib/detect.js';
import { isCliEntry, nodeMajorOk } from '../index.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const checkConfig = join(repoRoot, 'scripts', '_check_config.py');
const templateDir = join(here, '..', 'template');

// Best-effort consistency check: portable across CI (python3 / python / absent).
function pythonCmd() {
  for (const c of ['python3', 'python']) {
    try {
      execFileSync(c, ['--version'], { stdio: 'ignore' });
      return c;
    } catch {
      /* try next */
    }
  }
  return null;
}
const PY = pythonCmd();

let failures = 0;
async function test(label, fn) {
  const dir = await mkdtemp(join(tmpdir(), 'caf-'));
  try {
    await fn(dir);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${label}\n    ${err.message}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const cfg = async (dir) => JSON.parse(await readFile(join(dir, 'framework.config.json'), 'utf8'));
const compactCfg = async (dir) =>
  JSON.parse(await readFile(join(dir, '.agentik', 'framework.config.json'), 'utf8'));
const active = (dir, p) => existsSync(join(dir, p));
const parked = (dir, p) => existsSync(join(dir, '.framework/disabled', p));
const compactParked = (dir, p) => existsSync(join(dir, '.agentik/disabled', p));

function assertConsistent(dir) {
  // Reuse the framework's own consistency checker against the scaffolded repo.
  if (!PY) return; // no python on this runner — skip (best-effort, e.g. Windows CI)
  execFileSync(PY, [checkConfig], { cwd: dir, stdio: 'pipe' });
}

console.log('scaffold tests:');

await test('template snapshot excludes framework development state', async () => {
  assert.ok(!existsSync(join(templateDir, '.agents')), 'local Codex skill mirror excluded');
  assert.ok(!existsSync(join(templateDir, '.codex')), 'local Codex hooks excluded');
  assert.ok(!existsSync(join(templateDir, '.github')), 'framework-repo CI excluded');
  const specs = await readdir(join(templateDir, 'specs'));
  assert.deepEqual(specs.sort(), ['TEMPLATE.md', 'archive'], 'active development specs excluded');
  assert.match(await readFile(join(templateDir, 'README.md'), 'utf8'), /^# Agentik$/m);
  const templatePackage = JSON.parse(await readFile(join(templateDir, 'package.json'), 'utf8'));
  assert.equal(templatePackage.name, 'agentik');
});

await test('web-frontend: parks api-design + api-route + db-migration', async (dir) => {
  const r = await scaffold({ targetDir: dir, profile: 'web-frontend', name: 'Foo', git: false });
  assert.deepEqual(r.disabledRules, ['api-design']);
  assert.ok(parked(dir, 'rules/api-design.md'), 'api-design rule parked');
  assert.ok(parked(dir, 'cursor/api-design.mdc'), 'api-design mirror parked');
  assert.ok(!active(dir, 'rules/api-design.md'), 'api-design removed from active');
  assert.ok(parked(dir, 'skills/api-route'), 'api-route skill parked');
  assert.ok(parked(dir, 'skills/db-migration'), 'db-migration skill parked');
  assert.ok(active(dir, '.claude/skills/frontend-design'), 'frontend-design kept');
  assert.ok(active(dir, '.claude/skills/react-quality'), 'react-quality kept');
  const c = await cfg(dir);
  assert.equal(c.profile, 'web-frontend');
  assert.equal(c.rules['api-design'], false);
  assert.equal(c.skills['api-route'], false);
  assert.equal(c.rules['ui-ux'], true);
  const agents = await readFile(join(dir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /ACTIVE_PROFILE: web-frontend/);
  assertConsistent(dir);
});

await test('generic: parks react-nextjs/ui-ux + 4 skills', async (dir) => {
  const r = await scaffold({ targetDir: dir, profile: 'generic', name: 'G', git: false });
  assert.ok(r.disabledRules.includes('react-nextjs') && r.disabledRules.includes('ui-ux'));
  assert.ok(parked(dir, 'rules/react-nextjs.md'));
  assert.ok(!active(dir, '.claude/skills/react-component'));
  assert.ok(parked(dir, 'skills/react-quality'), 'react-quality skill parked');
  const c = await cfg(dir);
  assert.equal(c.profile, 'generic');
  assert.equal(c.rules['react-nextjs'], false);
  assert.equal(c.skills['frontend-design'], false);
  assertConsistent(dir);
});

await test('fullstack: parks nothing, all active', async (dir) => {
  const r = await scaffold({ targetDir: dir, profile: 'fullstack', name: 'FS', git: false });
  assert.deepEqual(r.disabledRules, []);
  assert.deepEqual(r.disabledSkills, []);
  assert.ok(active(dir, 'rules/api-design.md'));
  assert.ok(active(dir, '.claude/skills/react-quality/SKILL.md'));
  const c = await cfg(dir);
  assert.equal(c.profile, 'fullstack');
  assert.ok(Object.values(c.rules).every((v) => v === true));
  assertConsistent(dir);
});

await test('compact scaffold: keeps framework internals under .agentik', async (dir) => {
  const r = await scaffold({
    targetDir: dir,
    profile: 'generic',
    name: 'Compact',
    git: false,
    layout: 'compact',
  });
  assert.ok(active(dir, 'AGENTS.md'), 'root bridge AGENTS.md kept');
  assert.ok(active(dir, 'CLAUDE.md'), 'root bridge CLAUDE.md kept');
  assert.ok(active(dir, '.agentik/framework.config.json'), 'compact config written');
  assert.ok(active(dir, '.agentik/skills/write-spec/SKILL.md'), 'canonical skills moved under .agentik');
  assert.ok(active(dir, '.agentik/claude/skills/write-spec/SKILL.md'), 'Claude skill mirror kept');
  assert.ok(active(dir, '.agentik/rules/typescript.md'), 'rules moved under .agentik');
  assert.ok(active(dir, '.agentik/memory/CONTEXT.md'), 'memory moved under .agentik');
  assert.ok(active(dir, '.agentik/profiles/generic/profile.md'), 'profiles moved under .agentik');
  assert.ok(active(dir, '.agentik/specs/TEMPLATE.md'), 'specs moved under .agentik');
  assert.ok(active(dir, '.agentik/docs/adopting.md'), 'docs moved under .agentik');
  assert.ok(active(dir, '.agentik/README.md'), 'Agentik README moved under .agentik');
  assert.ok(active(dir, '.agentik/README.de.md'), 'Agentik German README moved under .agentik');
  assert.ok(active(dir, '.agentik/CHANGELOG.md'), 'Agentik changelog moved under .agentik');
  assert.ok(active(dir, '.agentik/CONTRIBUTING.md'), 'Agentik contributing guide moved under .agentik');
  assert.ok(active(dir, '.agentik/LICENSE'), 'Agentik license moved under .agentik');
  assert.ok(!active(dir, 'rules'), 'no root rules dir');
  assert.ok(!active(dir, 'memory'), 'no root memory dir');
  assert.ok(!active(dir, 'profiles'), 'no root profiles dir');
  assert.ok(!active(dir, 'specs'), 'no root specs dir');
  assert.ok(!active(dir, 'docs'), 'no root docs dir');
  assert.ok(!active(dir, '.framework'), 'no root .framework dir');
  assert.ok(!active(dir, 'README.md'), 'no Agentik README in root');
  assert.ok(!active(dir, 'README.de.md'), 'no Agentik German README in root');
  assert.ok(!active(dir, 'CHANGELOG.md'), 'no Agentik changelog in root');
  assert.ok(!active(dir, 'CONTRIBUTING.md'), 'no Agentik contributing guide in root');
  assert.ok(!active(dir, 'LICENSE'), 'no Agentik license in root');
  assert.ok(compactParked(dir, 'rules/react-nextjs.md'), 'disabled rule parked compactly');
  assert.ok(compactParked(dir, 'skills/react-quality/SKILL.md'), 'react-quality parked compactly');
  assert.ok(r.disabledRules.includes('react-nextjs'));
  const c = await compactCfg(dir);
  assert.equal(c.layout, 'compact');
  assert.equal(c.profile, 'generic');
  assert.match(await readFile(join(dir, 'AGENTS.md'), 'utf8'), /\.agentik\/AGENTS\.md/);
  assertConsistent(dir);
});

await test('refuses non-empty dir without --force', async (dir) => {
  await scaffold({ targetDir: dir, profile: 'fullstack', name: 'X', git: false });
  await assert.rejects(
    () => scaffold({ targetDir: dir, profile: 'fullstack', name: 'X', git: false }),
    /not empty/,
  );
});

async function fakeProject(dir, deps = {}) {
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      { name: 'app', version: '1.0.0', scripts: { test: 'jest' }, dependencies: deps },
      null,
      2,
    ) + '\n',
  );
  await mkdir(join(dir, 'src'), { recursive: true });
  await writeFile(join(dir, 'src', 'app.ts'), 'export const x = 1;\n');
  await writeFile(join(dir, 'README.md'), '# My App\n');
}

await test('add: code untouched + framework added + scripts merged + consistent', async (dir) => {
  await fakeProject(dir, { next: '^15.0.0' });
  const appBefore = await readFile(join(dir, 'src/app.ts'), 'utf8');
  const readmeBefore = await readFile(join(dir, 'README.md'), 'utf8');

  const r = await addInto({ targetDir: dir }); // no profile → detect from `next`
  assert.equal(r.profile, 'web-frontend', 'detected web-frontend from next');

  // developer's code is byte-identical
  assert.equal(await readFile(join(dir, 'src/app.ts'), 'utf8'), appBefore);
  assert.equal(await readFile(join(dir, 'README.md'), 'utf8'), readmeBefore);

  // framework present, including the full config system
  assert.ok(active(dir, 'AGENTS.md'));
  assert.ok(active(dir, 'rules/typescript.md'));
  assert.ok(active(dir, '.claude/skills/configure/SKILL.md'));
  assert.ok(active(dir, '.claude/skills/customize/SKILL.md'));
  assert.ok(active(dir, 'framework.config.json'));

  // package.json: existing script kept, gate scripts added
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'jest', 'existing test script untouched');
  assert.ok(pkg.scripts.verify && pkg.scripts['check:framework'], 'gate scripts added');

  // profile applied + consistent
  assert.ok(parked(dir, 'rules/api-design.md'));
  assertConsistent(dir);
});

await test('compact add: code untouched + framework internals under .agentik', async (dir) => {
  await fakeProject(dir, { next: '^15.0.0' });
  const appBefore = await readFile(join(dir, 'src/app.ts'), 'utf8');
  const readmeBefore = await readFile(join(dir, 'README.md'), 'utf8');

  const r = await addInto({ targetDir: dir, layout: 'compact' });

  assert.equal(r.layout, 'compact');
  assert.equal(await readFile(join(dir, 'src/app.ts'), 'utf8'), appBefore);
  assert.equal(await readFile(join(dir, 'README.md'), 'utf8'), readmeBefore);
  assert.ok(active(dir, 'AGENTS.md'), 'root bridge exists');
  assert.ok(active(dir, '.agentik/framework.config.json'));
  assert.ok(active(dir, '.agentik/rules/typescript.md'));
  assert.ok(active(dir, '.agentik/skills/configure/SKILL.md'));
  assert.ok(active(dir, '.agentik/claude/skills/configure/SKILL.md'));
  assert.ok(!active(dir, '.agentik/README.md'), 'add does not copy Agentik README into app');
  assert.ok(!active(dir, '.agentik/LICENSE'), 'add does not copy Agentik license into app');
  assert.ok(!active(dir, 'rules'), 'no root rules dir');
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'jest', 'existing test script untouched');
  assert.equal(pkg.scripts.verify, 'bash .agentik/scripts/verify.sh');
  assert.equal(pkg.scripts['check:framework'], 'bash .agentik/scripts/check-framework.sh');
  assertConsistent(dir);
});

await test('add: re-run is non-destructive (repair mode)', async (dir) => {
  await fakeProject(dir, {});
  await addInto({ targetDir: dir, profile: 'fullstack' });
  const r2 = await addInto({ targetDir: dir, profile: 'fullstack' });
  assert.equal(r2.alreadyInit, true, 'second run sees existing config');
  assert.ok(r2.skipped.length > 0, 'second run skips existing files');
  assertConsistent(dir);
});

await test('detectProfile: next→web-frontend, next+db→fullstack, express→fullstack, plain→generic', async () => {
  assert.equal(detectProfile({ dependencies: { next: '1' } }), 'web-frontend');
  assert.equal(detectProfile({ dependencies: { next: '1', '@prisma/client': '1' } }), 'fullstack');
  assert.equal(detectProfile({ dependencies: { express: '1' } }), 'fullstack');
  assert.equal(detectProfile({ devDependencies: { typescript: '1' } }), 'generic');
});

await test('detect: reads tooling, gates + package manager', async (dir) => {
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({
      dependencies: { next: '15' },
      devDependencies: { typescript: '5', vitest: '2', eslint: '9' },
    }),
  );
  await writeFile(join(dir, 'tsconfig.json'), '{}');
  await writeFile(join(dir, 'yarn.lock'), '');
  const d = detect(dir);
  assert.equal(d.profile, 'web-frontend');
  assert.equal(d.packageManager, 'yarn');
  assert.equal(d.typescript, true);
  assert.deepEqual(d.gates, { typecheck: 'tsc --noEmit', lint: 'eslint .', test: 'vitest run' });
  assert.ok(d.signals.includes('Next.js') && d.signals.includes('vitest') && d.signals.includes('yarn'));
});

await test('add: wires REAL gate commands + adapts verify.sh to the package manager', async (dir) => {
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'a', devDependencies: { typescript: '5', vitest: '2', eslint: '9' } }, null, 2),
  );
  await writeFile(join(dir, 'tsconfig.json'), '{}');
  await writeFile(join(dir, 'yarn.lock'), '');
  await addInto({ targetDir: dir });
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'vitest run', 'real test command wired');
  assert.equal(pkg.scripts.lint, 'eslint .', 'real lint command wired');
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit', 'real typecheck wired');
  const verify = await readFile(join(dir, 'scripts/verify.sh'), 'utf8');
  assert.ok(verify.includes('yarn run'), 'verify.sh adapted to yarn');
  assert.ok(!verify.includes('pnpm run --if-present'), 'no pnpm runner left');
  assertConsistent(dir);
});

const INDEX = join(here, '..', 'index.js');

await test('cli entry: --version and --help route correctly', async () => {
  const v = execFileSync('node', [INDEX, '--version']).toString().trim();
  assert.match(v, /^\d+\.\d+\.\d+$/, 'prints semver');
  const h = execFileSync('node', [INDEX, '--help']).toString();
  assert.match(h, /add \[dir\]/, 'help documents add');
  assert.match(h, /create-agentik/, 'help uses the Agentik package identity');
  assert.match(h, /npm create agentik@latest/, 'help shows the public npm command');
  const cliPackage = JSON.parse(await readFile(join(here, '..', 'package.json'), 'utf8'));
  assert.equal(cliPackage.name, 'create-agentik');
  assert.equal(cliPackage.bin['create-agentik'], 'index.js');
});

await test('cli entry: detects npm bin symlink as main', async (dir) => {
  const link = join(dir, 'create-agentik');
  try {
    await symlink(INDEX, link);
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return;
    throw error;
  }
  assert.equal(isCliEntry(link, pathToFileURL(INDEX).href), true);
});

await test('cli entry: greenfield scaffold via subprocess', async (dir) => {
  execFileSync('node', [INDEX, join(dir, 'app'), '--profile', 'generic', '--name', 'X', '--yes', '--no-git']);
  assert.ok(existsSync(join(dir, 'app', 'AGENTS.md')));
  assert.ok(existsSync(join(dir, 'app', '.agentik', 'framework.config.json')));
  assert.ok(!existsSync(join(dir, 'app', 'rules')));
});

await test('cli entry: add --dry-run via subprocess writes nothing', async (dir) => {
  await fakeProject(dir, {});
  const out = execFileSync('node', [INDEX, 'add', dir, '--yes', '--dry-run']).toString();
  assert.match(out, /DRY RUN/);
  assert.ok(!existsSync(join(dir, 'AGENTS.md')), 'nothing written');
});

await test('add: preserves package.json indentation (4-space)', async (dir) => {
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts: {} }, null, 4) + '\n');
  await addInto({ targetDir: dir, profile: 'generic' });
  const raw = await readFile(join(dir, 'package.json'), 'utf8');
  assert.ok(/\n {4}"name"/.test(raw), 'kept 4-space indentation (not forced to 2)');
});

await test('node version guard', async () => {
  assert.equal(nodeMajorOk('16.20.0'), false);
  assert.equal(nodeMajorOk('18.0.0'), true);
  assert.equal(nodeMajorOk('22.5.1'), true);
});

await test('add --dry-run writes nothing but reports a real plan', async (dir) => {
  await fakeProject(dir, { next: '^15' });
  const pkgBefore = await readFile(join(dir, 'package.json'), 'utf8');
  const r = await addInto({ targetDir: dir, dryRun: true });
  // plan is non-empty
  assert.ok(r.copied > 0, 'reports files that would be copied');
  assert.ok(r.scriptsAdded.includes('verify'), 'reports scripts that would be added');
  // nothing was written
  assert.equal(await readFile(join(dir, 'package.json'), 'utf8'), pkgBefore, 'package.json untouched');
  assert.ok(!existsSync(join(dir, 'AGENTS.md')), 'no framework files written');
  assert.ok(!existsSync(join(dir, 'framework.config.json')), 'no config written');
});

await test('update: refreshes framework files and preserves project-owned state', async (dir) => {
  await fakeProject(dir, {});
  await addInto({ targetDir: dir, profile: 'generic' });

  const configBefore = await readFile(join(dir, 'framework.config.json'), 'utf8');
  const packageBefore = await readFile(join(dir, 'package.json'), 'utf8');
  const readmeBefore = await readFile(join(dir, 'README.md'), 'utf8');
  const appBefore = await readFile(join(dir, 'src', 'app.ts'), 'utf8');
  await writeFile(join(dir, 'rules', 'typescript.md'), 'stale active rule\n');
  await writeFile(join(dir, '.framework', 'disabled', 'rules', 'react-nextjs.md'), 'stale parked rule\n');
  await writeFile(join(dir, 'memory', 'CONTEXT.md'), 'project memory\n');
  await writeFile(join(dir, 'specs', 'project-spec.md'), 'project spec\n');
  await writeFile(join(dir, 'rules', 'custom', 'billing.md'), 'project rule\n');
  await mkdir(join(dir, '.claude', 'skills', 'project-skill'), { recursive: true });
  await writeFile(join(dir, '.claude', 'skills', 'project-skill', 'SKILL.md'), 'project skill\n');
  await writeFile(join(dir, '.claude', 'settings.json'), '{"project":true}\n');
  await writeFile(join(dir, '.env.example'), 'PROJECT_SETTING=\n');

  const r = await updateInto({ targetDir: dir });

  assert.ok(r.updated > 0, 'reports refreshed framework files');
  assert.match(await readFile(join(dir, 'rules', 'typescript.md'), 'utf8'), /strict: true/);
  assert.match(
    await readFile(join(dir, '.framework', 'disabled', 'rules', 'react-nextjs.md'), 'utf8'),
    /React/,
  );
  assert.ok(
    r.files.includes('.framework/disabled/rules/react-nextjs.md'),
    'reports the actual parked destination',
  );
  assert.ok(!active(dir, 'rules/react-nextjs.md'), 'disabled rule stays parked');
  assert.equal(await readFile(join(dir, 'memory', 'CONTEXT.md'), 'utf8'), 'project memory\n');
  assert.equal(await readFile(join(dir, 'specs', 'project-spec.md'), 'utf8'), 'project spec\n');
  assert.equal(await readFile(join(dir, 'rules', 'custom', 'billing.md'), 'utf8'), 'project rule\n');
  assert.equal(
    await readFile(join(dir, '.claude', 'skills', 'project-skill', 'SKILL.md'), 'utf8'),
    'project skill\n',
  );
  assert.equal(await readFile(join(dir, '.claude', 'settings.json'), 'utf8'), '{"project":true}\n');
  assert.equal(await readFile(join(dir, '.env.example'), 'utf8'), 'PROJECT_SETTING=\n');
  assert.equal(await readFile(join(dir, 'framework.config.json'), 'utf8'), configBefore);
  assert.equal(await readFile(join(dir, 'package.json'), 'utf8'), packageBefore);
  assert.equal(await readFile(join(dir, 'README.md'), 'utf8'), readmeBefore);
  assert.equal(await readFile(join(dir, 'src', 'app.ts'), 'utf8'), appBefore);
  assertConsistent(dir);
});

await test('update --layout compact: migrates classic project and preserves project-owned state', async (dir) => {
  await fakeProject(dir, {});
  await addInto({ targetDir: dir, profile: 'generic' });
  await writeFile(join(dir, 'memory', 'CONTEXT.md'), 'project memory\n');
  await writeFile(join(dir, 'specs', 'project-spec.md'), 'project spec\n');
  await writeFile(join(dir, 'rules', 'custom', 'billing.md'), 'project rule\n');
  await mkdir(join(dir, '.claude', 'skills', 'project-skill'), { recursive: true });
  await writeFile(join(dir, '.claude', 'skills', 'project-skill', 'SKILL.md'), 'project skill\n');

  const r = await updateInto({ targetDir: dir, layout: 'compact' });

  assert.equal(r.migrated, true);
  assert.equal(r.layout, 'compact');
  assert.ok(active(dir, 'AGENTS.md'), 'root bridge remains');
  assert.ok(active(dir, '.agentik/AGENTS.md'), 'full AGENTS moved under .agentik');
  assert.ok(active(dir, '.agentik/skills/write-spec/SKILL.md'), 'canonical skills created during migration');
  assert.ok(active(dir, '.agentik/claude/skills/write-spec/SKILL.md'), 'Claude skills mirror kept');
  assert.ok(active(dir, '.agentik/framework.config.json'));
  assert.ok(!active(dir, '.agentik/README.md'), 'user README is not moved into .agentik');
  assert.ok(!active(dir, 'framework.config.json'));
  assert.ok(!active(dir, 'rules'));
  assert.ok(!active(dir, 'memory'));
  assert.ok(!active(dir, 'specs'));
  assert.ok(!active(dir, '.framework'));
  assert.equal(await readFile(join(dir, '.agentik/memory/CONTEXT.md'), 'utf8'), 'project memory\n');
  assert.equal(await readFile(join(dir, '.agentik/specs/project-spec.md'), 'utf8'), 'project spec\n');
  assert.equal(await readFile(join(dir, '.agentik/rules/custom/billing.md'), 'utf8'), 'project rule\n');
  assert.equal(
    await readFile(join(dir, '.agentik/skills/project-skill/SKILL.md'), 'utf8'),
    'project skill\n',
  );
  assert.equal(
    await readFile(join(dir, '.agentik/claude/skills/project-skill/SKILL.md'), 'utf8'),
    'project skill\n',
  );
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.verify, 'bash .agentik/scripts/verify.sh');
  assert.equal(pkg.scripts['check:framework'], 'bash .agentik/scripts/check-framework.sh');
  assertConsistent(dir);
});

await test('update --layout compact: moves unchanged Agentik root docs from classic scaffold', async (dir) => {
  await scaffold({ targetDir: dir, profile: 'fullstack', name: 'Classic', git: false, layout: 'classic' });

  const r = await updateInto({ targetDir: dir, layout: 'compact' });

  assert.equal(r.migrated, true);
  assert.ok(active(dir, '.agentik/README.md'), 'unchanged Agentik README moved');
  assert.ok(active(dir, '.agentik/README.de.md'), 'unchanged Agentik German README moved');
  assert.ok(active(dir, '.agentik/CHANGELOG.md'), 'unchanged Agentik changelog moved');
  assert.ok(active(dir, '.agentik/CONTRIBUTING.md'), 'unchanged Agentik contributing guide moved');
  assert.ok(active(dir, '.agentik/LICENSE'), 'unchanged Agentik license moved');
  assert.ok(!active(dir, 'README.md'), 'unchanged Agentik README removed from root');
  assert.ok(!active(dir, 'README.de.md'), 'unchanged Agentik German README removed from root');
  assert.ok(!active(dir, 'CHANGELOG.md'), 'unchanged Agentik changelog removed from root');
  assert.ok(!active(dir, 'CONTRIBUTING.md'), 'unchanged Agentik contributing guide removed from root');
  assert.ok(!active(dir, 'LICENSE'), 'unchanged Agentik license removed from root');
  assertConsistent(dir);
});

await test('update --layout compact: refuses unsafe .agentik collision', async (dir) => {
  await fakeProject(dir, {});
  await addInto({ targetDir: dir, profile: 'generic' });
  await mkdir(join(dir, '.agentik'), { recursive: true });
  await writeFile(join(dir, '.agentik', 'existing.txt'), 'collision\n');

  await assert.rejects(() => updateInto({ targetDir: dir, layout: 'compact' }), /\.agentik\/ already exists/);
  assert.ok(active(dir, 'rules'), 'classic source folders remain after failed migration');
  assert.ok(active(dir, 'framework.config.json'), 'classic config remains after failed migration');
});

await test('update: preserves the project package-manager runner', async (dir) => {
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'yarn-app', devDependencies: { typescript: '5' } }, null, 2),
  );
  await writeFile(join(dir, 'yarn.lock'), '');
  await addInto({ targetDir: dir, profile: 'generic' });
  assert.match(await readFile(join(dir, 'scripts', 'verify.sh'), 'utf8'), /yarn run/);

  await updateInto({ targetDir: dir });

  const verify = await readFile(join(dir, 'scripts', 'verify.sh'), 'utf8');
  assert.match(verify, /yarn run/);
  assert.ok(!verify.includes('pnpm run --if-present'));
});

await test('update --dry-run reports changes and writes nothing', async (dir) => {
  await fakeProject(dir, {});
  await addInto({ targetDir: dir, profile: 'generic' });
  const rulePath = join(dir, 'rules', 'typescript.md');
  await writeFile(rulePath, 'stale rule\n');
  const before = await readFile(rulePath, 'utf8');

  const r = await updateInto({ targetDir: dir, dryRun: true });

  assert.ok(r.updated > 0, 'reports files that would be updated');
  assert.ok(r.unchanged > 0, 'reports files already current');
  assert.equal(await readFile(rulePath, 'utf8'), before);
});

await test('update: rejects a project without Agentik', async (dir) => {
  await fakeProject(dir, {});
  await assert.rejects(() => updateInto({ targetDir: dir }), /framework\.config\.json.*Run .* add/i);
  assert.ok(!existsSync(join(dir, 'AGENTS.md')), 'writes nothing before rejecting');
});

await test('cli entry: update --dry-run routes correctly', async (dir) => {
  await fakeProject(dir, {});
  await addInto({ targetDir: dir, profile: 'generic' });
  const contextBefore = await readFile(join(dir, 'memory', 'CONTEXT.md'), 'utf8');
  const help = execFileSync('node', [INDEX, '--help']).toString();
  assert.match(help, /update \[dir\]/, 'help documents update');

  const out = execFileSync('node', [INDEX, 'update', dir, '--yes', '--dry-run']).toString();

  assert.match(out, /DRY RUN/);
  assert.equal(await readFile(join(dir, 'memory', 'CONTEXT.md'), 'utf8'), contextBefore);
});

await test('detect: Python project → generic + ruff/mypy/pytest', async (dir) => {
  await writeFile(join(dir, 'pyproject.toml'), '[project]\nname = "x"\n');
  const d = detect(dir);
  assert.equal(d.language, 'python');
  assert.equal(d.profile, 'generic');
  assert.deepEqual(d.gates, { typecheck: 'mypy .', lint: 'ruff check .', test: 'pytest' });
  assert.equal(d.packageManager, 'pip');
});

await test('detect: Rust project → cargo gates', async (dir) => {
  await writeFile(join(dir, 'Cargo.toml'), '[package]\nname = "x"\n');
  const d = detect(dir);
  assert.equal(d.language, 'rust');
  assert.equal(d.gates.test, 'cargo test');
  assert.equal(d.packageManager, 'cargo');
});

await test('detect: pnpm monorepo → tool + warning', async (dir) => {
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'root' }));
  await writeFile(join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n');
  const d = detect(dir);
  assert.equal(d.monorepo?.tool, 'pnpm-workspaces');
  assert.ok(d.warnings.some((w) => /monorepo/i.test(w)));
});

await test('detect: Next App Router is identified', async (dir) => {
  await writeFile(join(dir, 'package.json'), JSON.stringify({ dependencies: { next: '15', react: '19' } }));
  await mkdir(join(dir, 'app'), { recursive: true });
  const d = detect(dir);
  assert.equal(d.router, 'app');
  assert.ok(d.signals.includes('app-router'));
});

await test('add: Python project (no package.json) applies generic, no script merge', async (dir) => {
  await writeFile(join(dir, 'pyproject.toml'), '[project]\nname = "x"\n');
  const r = await addInto({ targetDir: dir });
  assert.equal(r.language, 'python');
  assert.equal(r.profile, 'generic');
  assert.equal(r.scriptsAdded.length, 0);
  assertConsistent(dir);
});

console.log(failures ? `\n${failures} test(s) failed` : '\nall cli tests passed');
process.exit(failures ? 1 : 0);
