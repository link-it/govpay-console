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

// Strato ECharts: l'UNICO che importa `echarts`/`ngx-echarts`. Le feature
// importano i componenti/tema da qui; il modello resta in `chart-model/`.
export * from './echarts.providers';
export * from './chart-theme';
export * from './gauge.mapper';
export * from './gauge-chart.component';
