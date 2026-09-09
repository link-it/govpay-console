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

import type { EChartsOption } from 'echarts';
import type { ChartTheme, TimeSeriesSpec } from '../chart-model';

/**
 * Mapper `TimeSeriesSpec → EChartsOption` per grafici a linee/aree su asse
 * temporale. **Unico punto** che conosce ECharts per le serie storiche:
 * asse `time`, `dataZoom` (inside + slider) per le serie dense, tooltip d'asse.
 */
export function toTimeSeriesOption(spec: TimeSeriesSpec, theme: ChartTheme): EChartsOption {
  const fmt = spec.format ?? ((v: number) => `${v}${spec.unit ?? ''}`);
  return {
    color: theme.palette,
    textStyle: { fontFamily: theme.fontFamily },
    grid: { left: 8, right: 14, top: 32, bottom: spec.zoom ? 56 : 24, containLabel: true },
    legend: { top: 0, textStyle: { color: theme.textMuted }, icon: 'roundRect' },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => (typeof v === 'number' ? fmt(v) : String(v ?? '')),
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: theme.axis } },
      axisLabel: { color: theme.textMuted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.axis } },
      axisLabel: { color: theme.textMuted },
    },
    dataZoom: spec.zoom
      ? [
          { type: 'inside' },
          { type: 'slider', height: 18, bottom: 12, borderColor: theme.axis },
        ]
      : undefined,
    series: spec.series.map((s) => ({
      name: s.name,
      type: 'line',
      showSymbol: false,
      smooth: true,
      areaStyle: spec.area ? { opacity: 0.12 } : undefined,
      data: s.points.map((p) => [p.t, p.y] as [number | string, number]),
    })),
  };
}
