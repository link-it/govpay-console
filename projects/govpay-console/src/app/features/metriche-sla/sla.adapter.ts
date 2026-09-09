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

import type { GaugeSpec } from '@core/charts/chart-model';
import type { SlaKpi } from './sla.model';

/**
 * Adapter di dominio: `SlaKpi` → {@link GaugeSpec}. Vive nel confine della
 * feature e **non importa echarts** (verificato da `npm run charts:check`).
 *
 * L'arco è colorato per soglia: rosso sotto il target, ambra in prossimità,
 * verde a target raggiunto. La lancetta è la conformità osservata; se assente
 * (`totale=0`) il valore centrale mostra "n/d" e la lancetta resta a 0.
 */
export function slaKpiToGauge(kpi: SlaKpi): GaugeSpec {
  const target = kpi.sogliaPercentile;
  const warnFrom = Math.max(0, target - 2);
  return {
    value: kpi.conformitaOsservata ?? 0,
    range: [90, 100],
    unit: '%',
    label: kpi.codice,
    thresholds: [
      { at: 90, level: 'critical' },
      { at: warnFrom, level: 'warn' },
      { at: target, level: 'ok' },
    ],
    format: (v) => (kpi.conformitaOsservata == null ? 'n/d' : `${v.toFixed(1)}%`),
  };
}
