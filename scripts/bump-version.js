#!/usr/bin/env node
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

/**
 * Bump della versione in package.json (e in app-config.json se presente).
 *
 * Uso:
 *   node scripts/bump-version.js patch    # 1.0.0 → 1.0.1
 *   node scripts/bump-version.js minor    # 1.0.0 → 1.1.0
 *   node scripts/bump-version.js major    # 1.0.0 → 2.0.0
 *   node scripts/bump-version.js 1.2.3    # Imposta versione specifica
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROJECT_NAME = 'govpay-console';

const packagePath = path.join(PROJECT_ROOT, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

const bumpType = process.argv[2];

if (!bumpType) {
  console.error('Uso: node bump-version.js <patch|minor|major|x.y.z>');
  process.exit(1);
}

let newVersion;

switch (bumpType) {
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  default:
    if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
      newVersion = bumpType;
    } else {
      console.error(`Versione non valida: ${bumpType}`);
      console.error('Uso: node bump-version.js <patch|minor|major|x.y.z>');
      process.exit(1);
    }
}

packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log(`✓ Versione aggiornata: ${currentVersion} → ${newVersion}`);

const appConfigPath = path.join(
  PROJECT_ROOT,
  'projects',
  PROJECT_NAME,
  'src',
  'assets',
  'config',
  'app-config.json'
);
if (fs.existsSync(appConfigPath)) {
  try {
    const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
    if (appConfig.AppConfig?.app) {
      appConfig.AppConfig.app.version = newVersion;
      fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2) + '\n', 'utf8');
      console.log(`✓ app-config.json aggiornato`);
    }
  } catch (err) {
    console.warn(`⚠ Impossibile aggiornare app-config.json: ${err.message}`);
  }
}
