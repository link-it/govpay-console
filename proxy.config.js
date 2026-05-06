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

/**
 * Configurazione proxy per `ng serve`.
 *
 * Modulo JS (non JSON) per:
 *   - commenti
 *   - selezione runtime del backend via env `GP_BACKEND`
 *   - logging esplicito di ogni richiesta proxata
 *
 * Uso:
 *   npm start                    # preset "local"  → http://172.16.2.109:8080
 *   npm run start:dev            # preset "dev-cloud" → https://dev.govcloud.it
 *   npm run start:demo           # preset "demo"   → https://demo.govcloud.it
 *   GP_BACKEND=demo ng serve --proxy-config proxy.config.js
 *
 * Path inoltrati (riflettono i context path canonici GovPay):
 *   /govpay-api-backoffice/*        → API backoffice (Basic / SPID / IAM / OAuth2)
 *   /govpay/backend/api/backoffice/* → fallback per installazioni locali custom (legacy)
 */

const BACKENDS = {
  local: 'http://172.16.2.109:8080',
  'local-alt': 'http://172.16.1.121:8082',
  'dev-cloud': 'https://dev.govcloud.it',
  demo: 'https://new-frontend.link.it',
};

const presetName = process.env.GP_BACKEND || 'local';
const target = BACKENDS[presetName];

if (!target) {
  const known = Object.keys(BACKENDS).join(', ');
  throw new Error(
    `[proxy.config.js] preset GP_BACKEND="${presetName}" non riconosciuto. Disponibili: ${known}`
  );
}

console.log(`[proxy] preset="${presetName}" → ${target}`);

const baseOptions = {
  target,
  secure: false,
  changeOrigin: true,
  logLevel: 'debug',
  // Riscrive il dominio dei cookie di sessione (XSRF, JSESSIONID, ...) su localhost
  // così il browser li mantiene tra le richieste in dev.
  cookieDomainRewrite: 'localhost',
  // Hook esplicito per loggare ogni richiesta che attraversa il proxy.
  // Se NON vedi righe `[proxy →]` nei log, vuol dire che l'app sta chiamando
  // un URL che non matcha nessuno dei pattern qui sotto (cache config? URL assoluto?).
  onProxyReq(proxyReq, req) {
    console.log(`[proxy →] ${req.method} ${req.url}  ⇒  ${target}${req.url}`);
  },
  onProxyRes(proxyRes, req) {
    console.log(`[proxy ←] ${proxyRes.statusCode} ${req.method} ${req.url}`);
  },
  onError(err, req) {
    console.error(`[proxy ✗] ${req.method} ${req.url} — ${err.message}`);
  },
};

const paths = {
  '/govpay-api-backoffice': { ...baseOptions },
  '/govpay/backend/api/backoffice': { ...baseOptions },
};

console.log(`[proxy] pattern attivi: ${Object.keys(paths).join(', ')}`);

module.exports = paths;
