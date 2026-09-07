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
 * Scarica i woff2 self-hosted dei font (da Google Fonts) e genera la CSS
 * locale con @font-face relativi. Sottoinsiemi latin + latin-ext, pesi 400-700.
 *
 *   node scripts/fetch-fonts.mjs
 *
 * I file finiscono in styles/fonts/<id>/ e vengono aggregati da fonts.css.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../projects/govpay-console/src/styles/fonts');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const SUBSETS = new Set(['latin']);

// id → { family, weights }
const FONTS = {
  inter: { family: 'Inter', weights: [400, 500, 600, 700] },
  roboto: { family: 'Roboto', weights: [400, 500, 600, 700] },
};

async function fetchFont(id, { family, weights }) {
  const dir = resolve(ROOT, id);
  mkdirSync(dir, { recursive: true });
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=swap`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();

  // Blocchi: /* subset */ @font-face { ... }
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[\s\S]*?\})/g;
  const out = [`/* ${family} — self-hosted (subset latin/latin-ext), generato da scripts/fetch-fonts.mjs */\n`];
  let m;
  let count = 0;
  while ((m = re.exec(css)) !== null) {
    const subset = m[1];
    let block = m[2];
    if (!SUBSETS.has(subset)) continue;
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1] ?? '400';
    const src = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    if (!src) continue;
    const file = `${id}-${weight}-${subset}.woff2`;
    const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
    writeFileSync(resolve(dir, file), buf);
    block = block.replace(/url\(https:[^)]+\.woff2\)/, `url('./${file}')`);
    out.push(`/* ${subset} */\n${block}`);
    count++;
  }
  writeFileSync(resolve(dir, `${id}.css`), out.join('\n\n') + '\n');
  console.log(`✓ ${id}: ${count} @font-face → ${dir}`);
}

for (const [id, cfg] of Object.entries(FONTS)) {
  await fetchFont(id, cfg);
}
console.log('done');
