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

/** Forma minima dei parametri del tooltip d'asse (non tipizzata da echarts). */
interface AxisTooltipParam {
  value: unknown;
  seriesIndex?: number;
  seriesName?: string;
  marker?: string;
  axisValueLabel?: string;
}

/**
 * Mapper `TimeSeriesSpec → EChartsOption` per grafici a linee/aree su asse
 * temporale. **Unico punto** che conosce ECharts per le serie storiche:
 * asse `time`, `dataZoom` (inside + slider) per le serie dense, tooltip d'asse.
 */
export function toTimeSeriesOption(spec: TimeSeriesSpec, theme: ChartTheme): EChartsOption {
  const globalFmt = spec.format ?? ((v: number) => `${v}${spec.unit ?? ''}`);
  // Uno o due assi Y (unità distinte, es. conformità % a sinistra, volume a destra).
  const axes = spec.yAxes?.length ? spec.yAxes : [{ format: spec.format }];
  const seriesFmt = spec.series.map((s) => axes[s.axisIndex ?? 0]?.format ?? globalFmt);
  const single = axes.length < 2;
  return {
    color: theme.palette,
    textStyle: { fontFamily: theme.fontFamily },
    grid: { left: 8, right: 14, top: 32, bottom: spec.zoom ? 56 : 24, containLabel: true },
    legend: { top: 0, textStyle: { color: theme.textMuted }, icon: 'roundRect' },
    tooltip: {
      trigger: 'axis',
      // Un solo asse: formattatore uniforme. Più assi (unità diverse): per-serie.
      valueFormatter: single ? (v) => (typeof v === 'number' ? globalFmt(v) : String(v ?? '')) : undefined,
      formatter: single
        ? undefined
        : (params) => {
            const arr = (Array.isArray(params) ? params : [params]) as unknown as AxisTooltipParam[];
            if (!arr.length) return '';
            const head = arr[0].axisValueLabel ?? '';
            const rows = arr.map((p) => {
              const raw = Array.isArray(p.value) ? p.value[1] : p.value;
              const txt = raw == null ? '—' : seriesFmt[p.seriesIndex ?? 0](raw as number);
              return `${p.marker ?? ''} ${p.seriesName}: <b>${txt}</b>`;
            });
            return [head, ...rows].join('<br/>');
          },
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: theme.axis } },
      axisLabel: { color: theme.textMuted },
    },
    yAxis: axes.map((ax, i) => ({
      type: 'value',
      position: i === 0 ? 'left' : 'right',
      name: ax.name,
      nameTextStyle: { color: theme.textMuted },
      splitLine: { show: i === 0, lineStyle: { color: theme.axis } },
      axisLabel: { color: theme.textMuted, formatter: ax.format ? (v: number) => ax.format!(v) : undefined },
    })),
    dataZoom: spec.zoom
      ? [
          { type: 'inside' },
          { type: 'slider', height: 18, bottom: 12, borderColor: theme.axis },
        ]
      : undefined,
    series: spec.series.map((s) => ({
      name: s.name,
      type: 'line',
      yAxisIndex: s.axisIndex ?? 0,
      showSymbol: false,
      smooth: true,
      connectNulls: spec.connectNulls ?? false,
      areaStyle: spec.area ? { opacity: 0.12 } : undefined,
      data: s.points.map((p) => [p.t, p.y] as [number | string, number | null]),
    })),
  };
}
