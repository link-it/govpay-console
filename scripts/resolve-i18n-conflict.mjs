#!/usr/bin/env node
/**
 * resolve-i18n-conflict.mjs — risolve automaticamente un conflitto
 * git su file i18n JSON (`assets/i18n/{it,en}.json`) usando un
 * deep-merge che preserva:
 *
 *   - i top-namespace della lib `@linkit/shared-ui` aggiunti in
 *     HEAD (`App`, `Common`, `Pagination`, `Tweaks`, `Auth`,
 *     `Layout`, `Profile`, `Theme`, `Language`, `Snackbar`, `Help`,
 *     `Maintenance`, `About`, `Placeholder`),
 *   - gli override consumer di HEAD (es. `App.Title = 'GovAudit'`),
 *   - le modifiche più recenti di develop sulle sub-keys consumer
 *     (tipicamente `app.*`).
 *
 * Strategia: start da HEAD (lib + override consumer), overlay
 * develop (modifiche più recenti vincono sulle sub-keys condivise).
 *
 * --- Quando usarlo ---
 *
 * Dopo un `git merge develop` che lascia conflitti su `it.json` /
 * `en.json` (sintomo: HEAD ha aggiunto i 13+ namespace lib, develop
 * ha modifiche sul namespace `app.*`).
 *
 * --- Uso ---
 *
 *   node scripts/resolve-i18n-conflict.mjs <path1.json> [path2.json] ...
 *
 * Es. da `[GOVDESK-V2]`:
 *
 *   node scripts/resolve-i18n-conflict.mjs \\
 *     govaudit-app-v2/projects/govaudit-app/src/assets/i18n/it.json \\
 *     govaudit-app-v2/projects/govaudit-app/src/assets/i18n/en.json
 *
 * Lo script:
 *  1. Cerca i marker `<<<<<<<` / `=======` / `>>>>>>>` nel file.
 *  2. Estrae i due body, li deserializza come JSON oggetti.
 *  3. Deep-merge con develop wins per le sub-keys condivise.
 *  4. Riscrive il file pulito (no marker) con `JSON.stringify(_, null, 2)`.
 *
 * Il file resta UNMERGED finché non si fa `git add <path>`.
 *
 * --- Assunzioni ---
 *
 *  - Esattamente 1 hunk in conflitto per file (1 set di marker).
 *  - Ogni body è una lista di key/value JSON valida quando wrappata
 *    in `{ ... }` (cioè la chiusura del top-level object esterno
 *    è fuori dal conflitto).
 *  - Le top-keys lib sono presenti solo in HEAD (caso tipico:
 *    HEAD le ha aggiunte via merge dalla lib, develop è indietro).
 *
 * Limitazioni note:
 *  - Non gestisce conflitti multi-hunk in un file. Se ce ne sono,
 *    lo script fallisce in modo esplicito.
 *  - Non gestisce conflitti dove HEAD/develop hanno key con
 *    sub-tree completamente diversi: la regola "develop wins"
 *    potrebbe rimuovere keys di HEAD che invece andrebbero
 *    preservate. Verifica sempre il diff post-merge prima di
 *    `git add`.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    const tv = target[k];
    const sv = source[k];
    if (
      tv !== undefined &&
      typeof tv === 'object' && !Array.isArray(tv) && tv !== null &&
      typeof sv === 'object' && !Array.isArray(sv) && sv !== null
    ) {
      deepMerge(tv, sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

function resolveI18nConflict(path) {
  const abs = resolvePath(path);
  if (!existsSync(abs)) {
    throw new Error(`File non esiste: ${abs}`);
  }

  const raw = readFileSync(abs, 'utf8');
  const lines = raw.split('\n');

  const startIdx = lines.findIndex((l) => l.startsWith('<<<<<<<'));
  const sepIdx = lines.findIndex((l) => l.startsWith('======='));
  const endIdx = lines.findIndex((l) => l.startsWith('>>>>>>>'));

  if (startIdx === -1 && sepIdx === -1 && endIdx === -1) {
    return { path: abs, status: 'no-conflict', reason: 'nessun marker' };
  }
  if (startIdx === -1 || sepIdx === -1 || endIdx === -1) {
    throw new Error(`Marker incompleti in ${abs} (start=${startIdx}, sep=${sepIdx}, end=${endIdx})`);
  }

  // Verifica che non ci siano altri marker oltre i primi 3.
  const extraStart = lines.slice(startIdx + 1).findIndex((l) => l.startsWith('<<<<<<<'));
  if (extraStart !== -1) {
    throw new Error(`File ${abs} ha multi-hunk: non supportato (gestire a mano).`);
  }

  const headBody = lines.slice(startIdx + 1, sepIdx).join('\n');
  const devBody = lines.slice(sepIdx + 1, endIdx).join('\n');

  // Body = lista di "key": value senza graffe top-level → wrap.
  // Rimuove eventuale trailing comma legale (raro).
  const stripTrailingComma = (s) => s.replace(/,\s*$/, '');

  let headJson, devJson;
  try {
    headJson = JSON.parse('{' + stripTrailingComma(headBody) + '}');
  } catch (err) {
    throw new Error(`Body HEAD non è JSON valido in ${abs}: ${err.message}`);
  }
  try {
    devJson = JSON.parse('{' + stripTrailingComma(devBody) + '}');
  } catch (err) {
    throw new Error(`Body develop non è JSON valido in ${abs}: ${err.message}`);
  }

  // Strategia: start da HEAD, deep-merge develop (develop wins per
  // sub-keys condivise; sub-keys solo-HEAD preservate; sub-keys
  // solo-develop aggiunte).
  const merged = deepMerge({ ...headJson }, devJson);
  const text = JSON.stringify(merged, null, 2) + '\n';
  writeFileSync(abs, text);

  return {
    path: abs,
    status: 'merged',
    headKeys: Object.keys(headJson),
    devKeys: Object.keys(devJson),
    mergedKeys: Object.keys(merged),
    bytes: text.length,
  };
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error(`${c.red}Usage:${c.reset} node scripts/resolve-i18n-conflict.mjs <path1.json> [path2.json] ...`);
  process.exit(1);
}

console.log(`${c.bold}resolve-i18n-conflict${c.reset}\n`);

let merged = 0;
let skipped = 0;
let failed = 0;

for (const p of paths) {
  try {
    const r = resolveI18nConflict(p);
    if (r.status === 'no-conflict') {
      console.log(`${c.gray}skip${c.reset}  ${p} ${c.gray}(${r.reason})${c.reset}`);
      skipped++;
      continue;
    }
    console.log(`${c.green}merged${c.reset} ${p}`);
    console.log(`  ${c.gray}HEAD keys (${r.headKeys.length}):${c.reset} ${r.headKeys.join(', ')}`);
    console.log(`  ${c.gray}develop keys (${r.devKeys.length}):${c.reset} ${r.devKeys.join(', ')}`);
    console.log(`  ${c.gray}merged keys (${r.mergedKeys.length}):${c.reset} ${r.mergedKeys.join(', ')}`);
    console.log(`  ${c.gray}bytes:${c.reset} ${r.bytes}`);
    merged++;
  } catch (err) {
    console.log(`${c.red}fail${c.reset}  ${p}`);
    console.log(`  ${c.red}${err.message}${c.reset}`);
    failed++;
  }
}

console.log('');
console.log(
  `${c.bold}Summary:${c.reset} ` +
    `${c.green}${merged} merged${c.reset}, ` +
    `${c.gray}${skipped} skip${c.reset}` +
    (failed > 0 ? `, ${c.red}${failed} fail${c.reset}` : ''),
);
console.log(
  `${c.gray}Ricordati: i file sono ancora UNMERGED in git. Fai \`git add <path>\` quando hai verificato il diff.${c.reset}`,
);

if (failed > 0) process.exit(2);
