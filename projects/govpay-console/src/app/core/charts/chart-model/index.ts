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

// Strato neutro dei grafici: modello di dominio, NESSUN import da echarts.
// La guardia `npm run charts:check` verifica che qui non entri codice di libreria.
export * from './chart-theme';
export * from './gauge';
export * from './time-series';
