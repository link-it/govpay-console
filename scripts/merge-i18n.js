#!/usr/bin/env node
/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

/**
 * merge-i18n.js — Genera `projects/<consumer>/src/assets/i18n/<lang>.json`
 * come merge di:
 *   1. `projects/lnk-shared-ui/src/i18n/<lang>.json`  (keys generiche, lib)
 *   2. `projects/<consumer>/src/i18n-domain/<lang>.json` (keys dominio)
 *
 * Il consumer override la lib in caso di collisione top-level (utile per
 * personalizzare singole stringhe senza forkare la lib).
 *
 * Eseguito come `prebuild` dal `package.json` del consumer (vedi script
 * `prebuild` e `start*`). Output `.gitignored`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONSUMER = 'govpay-console';
const LIB = 'lnk-shared-ui';
const LANGS = ['it', 'en'];

function load(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function deepMerge(a, b) {
  if (typeof a !== 'object' || a === null || Array.isArray(a)) return b;
  if (typeof b !== 'object' || b === null || Array.isArray(b)) return b;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    out[k] = k in a ? deepMerge(a[k], b[k]) : b[k];
  }
  return out;
}

const outDir = path.join(ROOT, 'projects', CONSUMER, 'src/assets/i18n');
fs.mkdirSync(outDir, { recursive: true });

for (const lang of LANGS) {
  const libPath = path.join(ROOT, 'projects', LIB, `src/i18n/${lang}.json`);
  const domainPath = path.join(ROOT, 'projects', CONSUMER, `src/i18n-domain/${lang}.json`);
  const outPath = path.join(outDir, `${lang}.json`);

  const lib = fs.existsSync(libPath) ? load(libPath) : {};
  const domain = fs.existsSync(domainPath) ? load(domainPath) : {};
  const merged = deepMerge(lib, domain);

  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n');
  console.log(
    `  ${lang}.json: ${Object.keys(lib).length} keys lib + ${Object.keys(domain).length} keys consumer → ${Object.keys(merged).length} keys`
  );
}

console.log('i18n merge done.');
