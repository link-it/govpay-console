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

/** Punto di una serie storica: istante `t` (timestamp ms o data ISO) e valore `y`. */
export interface TimeSeriesPoint {
  t: number | string;
  y: number;
}

/** Una serie nominata (una linea/area, una voce di legenda). */
export interface TimeSeries {
  name: string;
  points: TimeSeriesPoint[];
}

/**
 * Spec **neutra** di un grafico a serie storiche (linee/aree su asse temporale).
 * Non conosce ECharts: contratto fra gli adapter di dominio e i mapper di
 * libreria (vedi `chart-echarts/time-series.mapper.ts`).
 */
export interface TimeSeriesSpec {
  /** Serie da tracciare (una o più). */
  series: TimeSeries[];
  /** Unità di misura del valore (opzionale, usata nei formatter). */
  unit?: string;
  /** Riempi l'area sotto la linea. */
  area?: boolean;
  /** Abilita lo zoom temporale (`dataZoom`): consigliato su serie dense. */
  zoom?: boolean;
  /** Formattatore del valore per tooltip/assi (default: `${value}${unit}`). */
  format?: (value: number) => string;
}
