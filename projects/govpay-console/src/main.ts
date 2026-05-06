/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { VERSION, getFullVersion } from '@environments';

// Banner di versione al bootstrap (utile in produzione per il debug remoto)
console.log(
  `%c GovPay Console %c ${getFullVersion()} %c`,
  'background:#1e40af;color:#fff;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold;',
  'background:#0f172a;color:#fff;padding:4px 8px;border-radius:0 4px 4px 0;',
  ''
);
console.log(`Branch: ${VERSION.gitBranch} | Commit: ${VERSION.gitHashFull}`);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
