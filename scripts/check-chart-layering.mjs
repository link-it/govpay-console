/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * Guardia di layering dei grafici (vedi NOTE-CLAUDE/GRAFICI, §4 regola 3).
 *
 * Lo strato neutro `chart-model/` e gli adapter di dominio (`*.adapter.ts`
 * nelle feature) NON devono importare la libreria di rendering: se `echarts`
 * tracima lì, il costo di un cambio libreria esplode. Questo controllo
 * statico fallisce se trova import di `echarts`/`ngx-echarts` fuori dallo
 * strato `chart-echarts/`.
 *
 * Uso: `npm run charts:check` (eseguibile anche in CI).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'projects/govpay-console/src/app');

/** Import vietati nello strato neutro. */
const FORBIDDEN = /from\s+['"](echarts|echarts\/.*|ngx-echarts)['"]/;

/** Ritorna tutti i file .ts sotto `dir` che soddisfano `filter`. */
function collectTs(dir, filter, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectTs(full, filter, acc);
    else if (name.endsWith('.ts') && filter(full)) acc.push(full);
  }
  return acc;
}

// 1) tutto lo strato neutro chart-model/ ; 2) gli adapter di dominio delle feature.
const targets = [
  ...collectTs(join(SRC, 'core/charts/chart-model'), () => true),
  ...collectTs(join(SRC, 'features'), (f) => f.endsWith('.adapter.ts')),
];

const offenders = targets.filter((f) => FORBIDDEN.test(readFileSync(f, 'utf8')));

if (offenders.length) {
  console.error('ERRORE: import di libreria grafici fuori da chart-echarts/:\n');
  for (const f of offenders) console.error('  - ' + relative(ROOT, f));
  console.error('\nSposta il codice di libreria in core/charts/chart-echarts/.');
  process.exit(1);
}

console.log(`Layering grafici OK: ${targets.length} file verificati, nessun import di echarts fuori posto.`);
