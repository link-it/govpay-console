#!/usr/bin/env node
/**
 * sync-shared-ui.mjs — sincronizza le copie mirror di `@linkit/shared-ui`
 * nei workspace GovDesk a partire da un'unica `source of truth`
 * (di default `[GOVPAY]/govpay-console/projects/lnk-shared-ui`).
 *
 * Modalità mirror 1.D: ogni app GovDesk ha la propria copia di
 * `projects/lnk-shared-ui/` (dev buildless via TS paths). Questo script
 * propaga la sorgente sui target via `rsync --delete`, lasciando il
 * commit + ChangeLog al consumer (no auto-bump).
 *
 * --- Uso ---
 *
 *   node scripts/sync-shared-ui.mjs status
 *       tabella read-only: versione + N file diversi per ogni target.
 *
 *   node scripts/sync-shared-ui.mjs sync
 *       per ogni target chiede conferma e applica rsync.
 *
 *   node scripts/sync-shared-ui.mjs sync --target=govregistry
 *       solo un target.
 *
 *   node scripts/sync-shared-ui.mjs sync --apply
 *       no prompt (es. per CI).
 *
 *   node scripts/sync-shared-ui.mjs sync --build
 *       dopo il sync lancia `ng build lnk-shared-ui --configuration production`
 *       in ogni target per validare il packagr.
 *
 * --- Strict warning (no blocking) ---
 *
 * Se nel target ci sono file presenti che NON sono nel source, lo script
 * li elenca come "patch locale sospetta" e avvisa che il rsync li
 * rimuoverà (`--delete`). L'utente decide se procedere o uscire.
 *
 * Stessa cosa per working tree non pulito nel repo del consumer
 * (rilevato via `git status --porcelain`): warning ma non blocking.
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, 'sync-shared-ui.config.json');

if (!existsSync(configPath)) {
  console.error(`Missing config: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const sourcePath = resolve(__dirname, config.source);

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function readVersion(libPath) {
  try {
    const pkg = JSON.parse(readFileSync(join(libPath, 'package.json'), 'utf8'));
    return pkg.version ?? '?';
  } catch {
    return null;
  }
}

/**
 * Confronta `source` e `target` via `diff -rq`. Ritorna array di voci
 *   { path, status }
 * dove status ∈ { 'modified', 'only-in-source', 'only-in-target' }.
 */
function diffPaths(source, target) {
  const r = spawnSync(
    'diff',
    ['-rq', '--exclude=node_modules', '--exclude=dist', source, target],
    { encoding: 'utf8' }
  );
  // diff exit 0 = identical, 1 = differ (with stdout). Both are OK.
  const out = (r.stdout || '') + (r.stderr || '');
  const items = [];
  for (const line of out.split('\n').filter(Boolean)) {
    let m = line.match(/^Files (.+) and (.+) differ$/);
    if (m) {
      items.push({ path: m[1].replace(source + '/', ''), status: 'modified' });
      continue;
    }
    m = line.match(/^Only in (.+): (.+)$/);
    if (m) {
      const dir = m[1];
      const file = m[2];
      const full = join(dir, file);
      const isSource = dir === source || dir.startsWith(source + '/');
      const rel = full.replace((isSource ? source : target) + '/', '');
      items.push({ path: rel, status: isSource ? 'only-in-source' : 'only-in-target' });
    }
  }
  return items;
}

function gitClean(repoPath) {
  const r = spawnSync('git', ['-C', repoPath, 'status', '--porcelain'], { encoding: 'utf8' });
  if (r.status !== 0) return null; // not a git repo
  return r.stdout.trim().length === 0;
}

function gitCurrentBranch(repoPath) {
  const r = spawnSync('git', ['-C', repoPath, 'branch', '--show-current'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.trim() || '(detached)';
}

function pad(s, n, align = 'left') {
  const str = String(s ?? '');
  if (str.length >= n) return str;
  const fill = ' '.repeat(n - str.length);
  return align === 'right' ? fill + str : str + fill;
}

function ask(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function header() {
  console.log(`${c.bold}@linkit/shared-ui — mirror sync${c.reset}`);
  console.log(`source: ${c.cyan}${sourcePath}${c.reset} v${c.bold}${readVersion(sourcePath) ?? '?'}${c.reset}`);
  console.log('');
}

async function cmdStatus() {
  header();
  if (!existsSync(sourcePath)) {
    console.error(`${c.red}Source non trovato.${c.reset}`);
    process.exit(2);
  }

  const cols = { name: 14, version: 10, diff: 6, mod: 5, add: 5, del: 5, status: 0 };
  console.log(
    c.gray +
      pad('target', cols.name) +
      pad('version', cols.version) +
      pad('diff', cols.diff, 'right') +
      '  ' +
      pad('mod', cols.mod, 'right') +
      '  ' +
      pad('add', cols.add, 'right') +
      '  ' +
      pad('del', cols.del, 'right') +
      '  status' +
      c.reset
  );
  console.log(c.gray + '─'.repeat(60) + c.reset);

  for (const t of config.targets) {
    const tPath = resolve(__dirname, t.path);
    if (!existsSync(tPath)) {
      console.log(pad(t.name, cols.name) + c.red + 'MISSING (path non esiste)' + c.reset);
      continue;
    }
    const tVersion = readVersion(tPath);
    const diffs = diffPaths(sourcePath, tPath);
    const mod = diffs.filter((d) => d.status === 'modified').length;
    const add = diffs.filter((d) => d.status === 'only-in-source').length;
    const del = diffs.filter((d) => d.status === 'only-in-target').length;
    const total = mod + add + del;
    const status =
      total === 0
        ? `${c.green}✓ allineato${c.reset}`
        : del > 0
          ? `${c.yellow}⚠ patch locali sospette (${del})${c.reset}`
          : `${c.yellow}⟳ ${total} file da sync${c.reset}`;
    console.log(
      pad(t.name, cols.name) +
        pad(tVersion ?? '?', cols.version) +
        pad(total, cols.diff, 'right') +
        '  ' +
        pad(mod, cols.mod, 'right') +
        '  ' +
        pad(add, cols.add, 'right') +
        '  ' +
        pad(del, cols.del, 'right') +
        '  ' +
        status
    );
  }
  console.log('');
  console.log(
    `${c.gray}mod = file diversi, add = solo source (verranno copiati), del = solo target (verranno rimossi).${c.reset}`
  );
}

async function cmdSync(args) {
  const targetFilter = args.find((a) => a.startsWith('--target='))?.split('=')[1];
  const apply = args.includes('--apply');
  const buildAfter = args.includes('--build');

  header();

  const targets = targetFilter
    ? config.targets.filter((t) => t.name === targetFilter)
    : config.targets;

  if (targets.length === 0) {
    console.error(`${c.red}Nessun target match per --target=${targetFilter}${c.reset}`);
    process.exit(1);
  }

  let synced = 0;
  let skipped = 0;
  let failedBuilds = 0;

  for (const t of targets) {
    const tPath = resolve(__dirname, t.path);
    const tConsumer = resolve(__dirname, t.consumer);

    console.log(`${c.bold}=== ${t.name} ===${c.reset}`);
    console.log(`  path:     ${tPath}`);
    console.log(`  consumer: ${tConsumer}`);

    if (!existsSync(tPath)) {
      console.log(`  ${c.red}✗ path non esiste, skip${c.reset}\n`);
      skipped++;
      continue;
    }

    const tVersion = readVersion(tPath);
    const sVersion = readVersion(sourcePath);
    console.log(`  version:  ${tVersion}  →  ${c.bold}${sVersion}${c.reset}`);

    const diffs = diffPaths(sourcePath, tPath);
    if (diffs.length === 0) {
      console.log(`  ${c.green}✓ già allineato, skip${c.reset}\n`);
      skipped++;
      continue;
    }

    const localOnly = diffs.filter((d) => d.status === 'only-in-target');
    const branch = gitCurrentBranch(tConsumer);
    const clean = gitClean(tConsumer);

    if (clean === false) {
      console.log(
        `  ${c.yellow}⚠ working tree NON pulito nel repo del target (branch ${branch}).${c.reset}`
      );
      console.log(`    Commit/stash le modifiche locali prima del sync per evitare mix.`);
    }

    if (localOnly.length > 0) {
      console.log(
        `  ${c.yellow}⚠ ${localOnly.length} file presenti SOLO nel target — saranno RIMOSSI da rsync --delete:${c.reset}`
      );
      for (const p of localOnly.slice(0, 8)) console.log(`    - ${p.path}`);
      if (localOnly.length > 8) console.log(`    ... e altri ${localOnly.length - 8}`);
      console.log(
        `    Se sono patch locali da preservare, esci e gestisci a mano (es. cherry-pick post-sync).`
      );
    }

    const mod = diffs.filter((d) => d.status === 'modified').length;
    const add = diffs.filter((d) => d.status === 'only-in-source').length;
    console.log(`  diff:     ${diffs.length} file (${mod} mod, ${add} add, ${localOnly.length} del)`);

    if (!apply) {
      const answer = await ask(`  Procedo con rsync? [y/N] `);
      if (answer !== 'y' && answer !== 'yes') {
        console.log(`  ${c.gray}skip${c.reset}\n`);
        skipped++;
        continue;
      }
    }

    const rsync = spawnSync(
      'rsync',
      [
        '-a',
        '--delete',
        '--exclude=node_modules',
        '--exclude=dist',
        '--exclude=.git',
        sourcePath + '/',
        tPath + '/',
      ],
      { stdio: 'inherit' }
    );

    if (rsync.status !== 0) {
      console.log(`  ${c.red}✗ rsync fallito (exit ${rsync.status})${c.reset}\n`);
      continue;
    }

    console.log(`  ${c.green}✓ sync completato${c.reset}`);
    synced++;

    if (buildAfter) {
      console.log(`  building lnk-shared-ui...`);
      const build = spawnSync(
        'npx',
        ['ng', 'build', 'lnk-shared-ui', '--configuration', 'production'],
        { cwd: tConsumer, stdio: 'inherit' }
      );
      if (build.status === 0) {
        console.log(`  ${c.green}✓ build verde${c.reset}`);
      } else {
        console.log(`  ${c.red}✗ build fallita${c.reset}`);
        failedBuilds++;
      }
    }
    console.log('');
  }

  console.log(
    `${c.bold}Summary:${c.reset} ${c.green}${synced} sync${c.reset}, ${c.gray}${skipped} skip${c.reset}` +
      (failedBuilds > 0 ? `, ${c.red}${failedBuilds} build fail${c.reset}` : '')
  );
  console.log(
    `${c.gray}Ricordati: commit + ChangeLog del consumer sono a tua cura (no auto-bump).${c.reset}`
  );
}

const [cmd, ...rest] = process.argv.slice(2);
const cleanArgs = rest.filter((a) => a !== '--');

if (!cmd || cmd === '--help' || cmd === '-h') {
  console.log(`Usage:
  node scripts/sync-shared-ui.mjs status
  node scripts/sync-shared-ui.mjs sync [--target=<name>] [--apply] [--build]

See header of ${import.meta.url.replace('file://', '')} for details.`);
  process.exit(0);
}

try {
  if (cmd === 'status') await cmdStatus(cleanArgs);
  else if (cmd === 'sync') await cmdSync(cleanArgs);
  else {
    console.error(`unknown command: ${cmd}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`${c.red}error:${c.reset} ${err.message}`);
  process.exit(1);
}
