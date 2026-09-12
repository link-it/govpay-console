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
import type { ChartTheme, GaugeSpec } from '../chart-model';

/**
 * Converte le soglie della spec negli stop di colore dell'`axisLine` di ECharts,
 * nel formato `[[frazione, colore], …]` con frazioni crescenti che terminano a 1.
 * Ogni segmento è colorato col livello che inizia alla sua soglia.
 */
function axisLineStops(spec: GaugeSpec, theme: ChartTheme): [number, string][] {
  const [min, max] = spec.range;
  const span = max - min || 1;
  const ths = (spec.thresholds ?? []).slice().sort((a, b) => a.at - b.at);
  if (!ths.length) return [[1, theme.status.ok]];
  return ths.map((th, i) => {
    const end = i + 1 < ths.length ? ths[i + 1].at : max;
    const fraction = Math.min(1, Math.max(0, (end - min) / span));
    return [fraction, theme.status[th.level]];
  });
}

/**
 * Mapper `GaugeSpec → EChartsOption`. **Unico punto** che sa cosa sia ECharts
 * per il gauge: gli override specifici della libreria vivono qui, mai nelle
 * feature (§4, escape hatch confinato).
 */
export function toGaugeOption(spec: GaugeSpec, theme: ChartTheme): EChartsOption {
  const [min, max] = spec.range;
  const fmt = spec.format ?? ((v: number) => `${v}${spec.unit}`);
  return {
    textStyle: { fontFamily: theme.fontFamily },
    series: [
      {
        type: 'gauge',
        min,
        max,
        startAngle: 210,
        endAngle: -30,
        radius: '92%',
        center: ['50%', '58%'],
        progress: { show: false },
        axisLine: { lineStyle: { width: 12, color: axisLineStops(spec, theme) } },
        pointer: { width: 4, length: '62%', itemStyle: { color: theme.text } },
        anchor: { show: true, size: 12, itemStyle: { color: theme.text } },
        axisTick: { distance: -16, length: 5, lineStyle: { color: theme.axis } },
        splitLine: { distance: -16, length: 12, lineStyle: { color: theme.axis } },
        axisLabel: { distance: 18, color: theme.textMuted, fontSize: 10 },
        title: { offsetCenter: [0, '-30%'], color: theme.textMuted, fontSize: 12 },
        detail: {
          offsetCenter: [0, '30%'],
          formatter: (v: number) => fmt(v),
          color: theme.text,
          fontSize: 22,
          fontWeight: 600,
        },
        data: [{ value: spec.value, name: spec.label ?? '' }],
      },
    ],
  };
}
