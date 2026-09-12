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

import type { ChartLevel } from './chart-theme';

/** Soglia posizionata sull'arco del gauge: da `at` in poi vale `level`. */
export interface GaugeThreshold {
  /** Valore (nell'unità del range) da cui inizia il livello. */
  at: number;
  /** Livello semantico del segmento (colore risolto dal tema). */
  level: Exclude<ChartLevel, 'muted'>;
}

/**
 * Spec **neutra** di un gauge (tachimetro). Non conosce ECharts: è il contratto
 * fra gli adapter di dominio (DTO → ChartSpec) e i mapper di libreria
 * (ChartSpec → option). Vedi `chart-echarts/gauge.mapper.ts`.
 */
export interface GaugeSpec {
  /** Valore corrente rappresentato dalla lancetta. */
  value: number;
  /** Estremi dell'arco `[min, max]`. */
  range: [number, number];
  /** Unità di misura (es. `'%'`, `'ms'`). */
  unit: string;
  /** Etichetta breve sotto il valore (opzionale). */
  label?: string;
  /** Soglie che colorano l'arco; ordinate o meno, il mapper le riordina. */
  thresholds?: GaugeThreshold[];
  /** Formattatore del valore centrale (default: `${value}${unit}`). */
  format?: (value: number) => string;
}
