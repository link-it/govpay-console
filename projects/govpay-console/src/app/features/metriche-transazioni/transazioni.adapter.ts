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

import type { TimeSeriesSpec } from '@core/charts/chart-model';
import type { AndamentoTransazioni } from './transazioni.model';

/** Etichette (tradotte) delle due serie. */
export interface TransazioniSerieLabels {
  pagate: string;
  fallite: string;
}

const NUM_IT = new Intl.NumberFormat('it-IT');

/**
 * Adapter di dominio: `AndamentoTransazioni` → {@link TimeSeriesSpec}. Vive nel
 * confine della feature e **non importa echarts** (verificato da
 * `npm run charts:check`). Abilita area e zoom temporale: la serie è densa (~90
 * punti), il caso in cui `dataZoom` di ECharts porta il vantaggio maggiore.
 */
export function andamentoToTimeSeries(
  a: AndamentoTransazioni,
  labels: TransazioniSerieLabels,
): TimeSeriesSpec {
  const at = (data: string) => Date.parse(`${data}T00:00:00Z`);
  return {
    area: true,
    zoom: true,
    format: (v) => NUM_IT.format(v),
    series: [
      { name: labels.pagate, points: a.giorni.map((g) => ({ t: at(g.data), y: g.pagate })) },
      { name: labels.fallite, points: a.giorni.map((g) => ({ t: at(g.data), y: g.fallite })) },
    ],
  };
}
