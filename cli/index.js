#!/usr/bin/env node
// create-agentik — scaffold an agentic-coding project.
// Powerful but simple: a few prompts, then it does the structural work
// (template, profile, config, git) and hands the rest to /init-foundation.
//
// Non-interactive (zero deps):
//   node index.js my-app --profile web-frontend --name "My App" --yes
// Interactive (pretty UI, loads @clack/prompts on demand):
//   npm create agentik@latest

import { parseArgs } from 'node:util';
import { basename, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { scaffold } from './lib/scaffold.js';
import { addInto } from './lib/overlay.js';
import { updateInto } from './lib/update.js';
import { detect, pmExec } from './lib/detect.js';
import { PROFILE_NAMES, PROFILES } from './lib/profiles.js';

export const MIN_NODE = 18;
export function nodeMajorOk(v = process.versions.node) {
  return Number(String(v).split('.')[0]) >= MIN_NODE;
}
function readVersion() {
  try {
    return JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

const HELP = `
create-agentik — set up agentic coding in a project

Usage:
  npm create agentik@latest [dir]        new project (scaffold)
  npm create agentik@latest add [dir]    existing project (overlay)
  npm create agentik@latest update [dir] refresh an adopted project

New project options:
  --profile <name>   ${PROFILE_NAMES.join(' | ')}   (default: web-frontend)
  --name <name>      project name (default: target directory name)
  --no-git           skip \`git init\`
  --force            scaffold into a non-empty directory

add (existing project) — copies only framework files, never touches your code:
  --profile <name>   default: auto-detected from your dependencies
  --dry-run          show what would change; write nothing
  --force            overwrite framework files that already exist

update (adopted project) — refreshes framework-owned files, preserves your work:
  --dry-run          show what would change; write nothing

Common:
  -y, --yes          non-interactive; use flags + defaults (no prompts)
  -h, --help         show this help
  -v, --version      print version

After scaffold/add, open the project with Claude Code or Codex and run
/init-foundation (or say "init") to wire the quality gates and capture your domain.
`;

function parse() {
  // node's parseArgs has no `--no-x` negation; handle --no-git ourselves.
  const raw = process.argv.slice(2);
  const noGit = raw.includes('--no-git');
  const args = raw.filter((a) => a !== '--no-git');
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    options: {
      profile: { type: 'string' },
      name: { type: 'string' },
      force: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      yes: { type: 'boolean', short: 'y', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
  });
  /** @type {Record<string, any>} */
  const values = parsed.values;
  values.git = !noGit;
  return { values, positionals: parsed.positionals };
}

function finalName(name, dir) {
  if (name) return name;
  const d = resolve(dir || '.');
  return basename(d);
}

async function runNonInteractive({ values, dir }) {
  const targetDir = dir || '.';
  const profile = values.profile || 'web-frontend';
  if (!PROFILES[profile]) {
    console.error(`Unknown profile "${profile}". Choose: ${PROFILE_NAMES.join(', ')}`);
    process.exit(1);
  }
  const result = await scaffold({
    targetDir,
    profile,
    name: finalName(values.name, targetDir),
    git: values.git,
    force: values.force,
    log: (m) => console.log('  ' + m),
  });
  console.log(
    `\n✓ scaffolded (${profile}). Next: cd ${targetDir} → open with Claude/Codex → run /init-foundation`,
  );
  return result;
}

async function runInteractive({ values, dir }) {
  let p;
  try {
    p = await import('@clack/prompts');
  } catch {
    console.error(
      'Interactive mode needs @clack/prompts. Re-run with --yes for the zero-dep path,\n' +
        'or install deps. Example: node index.js my-app --profile web-frontend --yes',
    );
    process.exit(1);
  }
  const cancel = (v) => {
    if (p.isCancel(v)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    return v;
  };

  p.intro('create-agentik');

  const targetDir =
    dir ??
    cancel(
      await p.text({ message: 'Project directory?', placeholder: './my-app', defaultValue: './my-app' }),
    );
  const profile =
    values.profile ??
    cancel(
      await p.select({
        message: 'Profile?',
        options: PROFILE_NAMES.map((n) => ({ value: n, label: n, hint: PROFILES[n].hint })),
        initialValue: 'web-frontend',
      }),
    );
  const name =
    values.name ??
    cancel(await p.text({ message: 'Project name?', defaultValue: finalName(undefined, targetDir) }));
  const git =
    values.git === false
      ? false
      : cancel(await p.confirm({ message: 'Initialize a git repo?', initialValue: true }));

  const s = p.spinner();
  s.start('Scaffolding');
  try {
    const result = await scaffold({ targetDir, profile, name, git, force: values.force, log: () => {} });
    s.stop('Scaffolded');
    const parked =
      result.disabledRules.length || result.disabledSkills.length
        ? `Parked for ${profile}: ${[...result.disabledRules, ...result.disabledSkills].join(', ') || 'nothing'}.`
        : 'Full module set kept.';
    p.note(
      `${parked}\n\ncd ${targetDir}\n# open with Claude Code or Codex, then:\n/init-foundation   # wire gates + capture your domain`,
      'Next steps',
    );
    p.outro('Done — happy (agentic) building.');
  } catch (err) {
    s.stop('Failed');
    p.cancel(String(err.message || err));
    process.exit(1);
  }
}

// Returns true if `dir` is a git repo with uncommitted changes.
function gitDirty(dir) {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.toString().trim().length > 0;
  } catch {
    return false; // not a git repo (or git missing) → nothing to warn about
  }
}

function dryRunPlan(r) {
  const lines = [
    `DRY RUN — nothing was written.`,
    `Would copy ${r.copied} framework file(s); skip ${r.skipped.length} existing.`,
  ];
  if (r.alreadyInit) lines.push('Already initialized — would fill missing files only.');
  else {
    lines.push(`Would apply profile: ${r.profile}.`);
    if (r.disabledRules.length || r.disabledSkills.length)
      lines.push(`Would park: ${[...r.disabledRules, ...r.disabledSkills].join(', ')}.`);
    if (r.scriptsAdded.length) lines.push(`Would add package.json scripts: ${r.scriptsAdded.join(', ')}.`);
    if (r.pmAdapted) lines.push(`Would adapt verify.sh to ${r.packageManager}.`);
  }
  return lines.join('\n');
}

function gatesLine(gates) {
  const parts = [];
  if (gates.typecheck) parts.push(`typecheck=${gates.typecheck}`);
  if (gates.lint) parts.push(`lint=${gates.lint}`);
  if (gates.test) parts.push(`test=${gates.test}`);
  return parts.length ? parts.join('  ') : 'none detected (will stub — /init-foundation wires them)';
}

function proposalSummary(d) {
  return (
    `Detected: ${d.signals.join(', ') || 'nothing notable'}\n` +
    `→ profile: ${d.profile}\n` +
    `→ gates:   ${gatesLine(d.gates)}\n` +
    `→ pm:      ${d.packageManager || 'n/a'}` +
    (d.warnings.length ? `\n⚠ ${d.warnings.join('\n⚠ ')}` : '')
  );
}

async function loadClack() {
  try {
    return await import('@clack/prompts');
  } catch {
    console.error(
      'Interactive mode needs @clack/prompts. Re-run with --yes for the zero-dep path.\n' +
        'Example: node index.js add . --profile web-frontend --yes',
    );
    process.exit(1);
  }
}

async function runAddNonInteractive({ values, dir }) {
  const targetDir = dir || '.';
  const dryRun = values['dry-run'];
  const proposal = detect(resolve(targetDir));
  console.log('  ' + proposalSummary(proposal).replace(/\n/g, '\n  '));
  if (!dryRun && gitDirty(targetDir)) {
    console.warn('  ⚠ working tree has uncommitted changes — framework files will be added on top.');
  }
  const r = await addInto({
    targetDir,
    profile: values.profile, // override; else detected
    detected: proposal,
    force: values.force,
    dryRun,
    log: dryRun ? () => {} : (m) => console.log('  ' + m),
  });
  if (dryRun) {
    console.log('\n' + dryRunPlan(r));
    return r;
  }
  const what = r.alreadyInit
    ? 'already initialized — filled missing files only'
    : `profile ${r.profile} applied`;
  const run = pmExec(r.packageManager);
  console.log(`\n✓ added the framework to ${targetDir} (${what}).`);
  console.log(`  Next: open with Claude/Codex → /init-foundation   (then \`${run} verify\`)`);
  return r;
}

async function runAddInteractive({ values, dir }) {
  const p = await loadClack();
  const cancel = (v) => {
    if (p.isCancel(v)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    return v;
  };
  p.intro('create-agentik · add to an existing project');
  const targetDir =
    dir ?? cancel(await p.text({ message: 'Project directory?', placeholder: '.', defaultValue: '.' }));

  const proposal = detect(resolve(targetDir));
  p.note(proposalSummary(proposal), 'Smart detection');

  // Propose; let the user accept or override.
  const dryRun = values['dry-run'];
  let profile = values.profile ?? proposal.profile;
  if (!values.profile) {
    const ok = cancel(
      await p.confirm({ message: `Use this setup (profile: ${proposal.profile})?`, initialValue: true }),
    );
    if (!ok) {
      profile = cancel(
        await p.select({
          message: 'Pick a profile instead',
          options: PROFILE_NAMES.map((n) => ({ value: n, label: n, hint: PROFILES[n].hint })),
          initialValue: proposal.profile,
        }),
      );
    }
  }

  if (dryRun) {
    const r = await addInto({ targetDir, profile, detected: proposal, force: values.force, dryRun: true });
    p.note(dryRunPlan(r), 'Dry run');
    p.outro('Nothing written. Re-run without --dry-run to apply.');
    return;
  }

  // Touching an existing repo — warn on a dirty working tree so changes are reviewable.
  if (gitDirty(targetDir)) {
    const go = cancel(
      await p.confirm({
        message: 'Working tree has uncommitted changes. Add framework files anyway?',
        initialValue: true,
      }),
    );
    if (!go) {
      p.cancel('Stopped. Commit or stash first, then re-run.');
      process.exit(0);
    }
  }

  const s = p.spinner();
  s.start('Adding framework');
  try {
    const r = await addInto({ targetDir, profile, detected: proposal, force: values.force, log: () => {} });
    s.stop('Added');
    const run = pmExec(r.packageManager);
    const summary = r.alreadyInit
      ? 'Already initialized — filled missing files only.'
      : `Profile: ${r.profile}. Scripts added: ${r.scriptsAdded.join(', ') || 'none'} (gates wired to your tools).`;
    p.note(
      `${summary}\nSkipped ${r.skipped.length} file(s) that already existed.\n\n` +
        `# open with Claude Code or Codex, then:\n/init-foundation   # finish gates + capture your domain\n# verify anytime:\n${run} verify`,
      'Next steps',
    );
    p.outro('Done — your code was never touched.');
  } catch (err) {
    s.stop('Failed');
    p.cancel(String(err.message || err));
    process.exit(1);
  }
}

function updatePlan(r) {
  const heading = r.dryRun ? 'DRY RUN — nothing was written.' : 'Framework updated.';
  const files = r.files.length ? `\nFiles: ${r.files.join(', ')}` : '';
  return (
    `${heading}\n` +
    `${r.dryRun ? 'Would update' : 'Updated'} ${r.updated} framework file(s); ` +
    `${r.unchanged} already current.${files}`
  );
}

async function runUpdateNonInteractive({ values, dir }) {
  const targetDir = dir || '.';
  const dryRun = values['dry-run'];
  if (!dryRun && gitDirty(targetDir)) {
    console.warn('  ⚠ working tree has uncommitted changes — review the framework update diff.');
  }
  const result = await updateInto({
    targetDir,
    dryRun,
    log: dryRun ? () => {} : (message) => console.log('  ' + message),
  });
  console.log('\n' + updatePlan(result));
  return result;
}

async function runUpdateInteractive({ values, dir }) {
  const p = await loadClack();
  const cancel = (value) => {
    if (p.isCancel(value)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    return value;
  };
  p.intro('create-agentik · update');
  const targetDir =
    dir ?? cancel(await p.text({ message: 'Project directory?', placeholder: '.', defaultValue: '.' }));
  const dryRun = values['dry-run'];

  if (!dryRun && gitDirty(targetDir)) {
    const proceed = cancel(
      await p.confirm({
        message: 'Working tree has uncommitted changes. Update framework files anyway?',
        initialValue: false,
      }),
    );
    if (!proceed) {
      p.cancel('Stopped. Commit or stash first, then re-run.');
      process.exit(0);
    }
  }

  const spinner = p.spinner();
  spinner.start(dryRun ? 'Planning update' : 'Updating framework');
  try {
    const result = await updateInto({ targetDir, dryRun });
    spinner.stop(dryRun ? 'Plan ready' : 'Framework updated');
    p.note(updatePlan(result), dryRun ? 'Dry run' : 'Update summary');
    p.outro(
      dryRun
        ? 'Nothing written. Re-run without --dry-run to apply.'
        : 'Done — project memory and customizations were preserved.',
    );
  } catch (error) {
    spinner.stop('Failed');
    p.cancel(String(error.message || error));
    process.exit(1);
  }
}

async function main() {
  const { values, positionals } = parse();
  if (values.version) {
    console.log(readVersion());
    return;
  }
  if (values.help) {
    console.log(HELP);
    return;
  }
  if (!nodeMajorOk()) {
    console.error(`create-agentik needs Node ${MIN_NODE}+. You have ${process.versions.node}.`);
    process.exit(1);
  }
  if (positionals[0] === 'add') {
    const dir = positionals[1];
    if (values.yes) await runAddNonInteractive({ values, dir });
    else await runAddInteractive({ values, dir });
    return;
  }
  if (positionals[0] === 'update') {
    const dir = positionals[1];
    if (values.yes) await runUpdateNonInteractive({ values, dir });
    else await runUpdateInteractive({ values, dir });
    return;
  }
  const dir = positionals[0];
  if (values.yes) await runNonInteractive({ values, dir });
  else await runInteractive({ values, dir });
}

// Only run when executed as the CLI entry — lets tests import helpers safely.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((err) => {
    console.error(String(err?.message || err));
    process.exit(1);
  });
}

export { main };
