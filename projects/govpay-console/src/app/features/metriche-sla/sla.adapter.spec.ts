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

import { describe, expect, it } from 'vitest';
import { slaKpiToGauge, slaSerieToTimeSeries } from './sla.adapter';
import type { SlaKpi, SlaSerieStoricaResponse } from './sla.model';

const base: SlaKpi = {
  codice: 'TDP',
  metodo: 'paDemandPaymentNotice',
  sogliaSecondi: 2,
  sogliaPercentile: 98,
  conformitaOsservata: 99.2,
  totale: 100,
  sopraSoglia: 1,
  stato: 'OK',
};

describe('slaKpiToGauge', () => {
  it('mappa valore, range, unità e label dal KPI', () => {
    const g = slaKpiToGauge(base);
    expect(g.value).toBe(99.2);
    expect(g.range).toEqual([90, 100]);
    expect(g.unit).toBe('%');
    expect(g.label).toBe('TDP');
  });

  it('costruisce le soglie critical→warn→ok attorno al target', () => {
    const g = slaKpiToGauge(base);
    expect(g.thresholds).toEqual([
      { at: 90, level: 'critical' },
      { at: 96, level: 'warn' },
      { at: 98, level: 'ok' },
    ]);
  });

  it('formatta la percentuale con una cifra decimale', () => {
    const g = slaKpiToGauge(base);
    expect(g.format?.(99.2)).toBe('99.2%');
  });

  it('con conformità assente (totale=0) usa 0 e mostra "n/d"', () => {
    const g = slaKpiToGauge({ ...base, conformitaOsservata: null, totale: 0, stato: 'WARNING' });
    expect(g.value).toBe(0);
    expect(g.format?.(0)).toBe('n/d');
  });
});

const serie: SlaSerieStoricaResponse = {
  periodo: { da: '2026-09-01', a: '2026-09-02' },
  codice: 'TDP',
  metodo: 'paDemandPaymentNotice',
  granularitaMinuti: 1440,
  sogliaSecondi: 2,
  sogliaPercentile: 98,
  serieStorica: [
    { data: '2026-09-01T00:00:00Z', totale: 100, conformitaOsservata: 99.1 },
    { data: '2026-09-02T00:00:00Z', totale: 0, conformitaOsservata: null },
  ],
};

describe('slaSerieToTimeSeries', () => {
  const labels = { conformita: 'Conformità', totale: 'Invocazioni' };

  it('crea due serie su assi distinti (conformità % + totale) con gap sui null', () => {
    const s = slaSerieToTimeSeries(serie, labels);
    expect(s.zoom).toBe(true);
    expect(s.connectNulls).toBe(false);
    expect(s.yAxes).toHaveLength(2);
    expect(s.series).toHaveLength(2);
    expect(s.series[0].axisIndex).toBe(0);
    expect(s.series[1].axisIndex).toBe(1);
  });

  it('conformità: punti [timestamp, valore|null]; totale: sempre numerico', () => {
    const s = slaSerieToTimeSeries(serie, labels);
    expect(s.series[0].points[0]).toEqual({ t: Date.parse('2026-09-01T00:00:00Z'), y: 99.1 });
    expect(s.series[0].points[1]).toEqual({ t: Date.parse('2026-09-02T00:00:00Z'), y: null });
    expect(s.series[1].points[1]).toEqual({ t: Date.parse('2026-09-02T00:00:00Z'), y: 0 });
  });
});
