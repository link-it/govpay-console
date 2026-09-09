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
import { andamentoToTimeSeries } from './transazioni.adapter';
import type { AndamentoTransazioni } from './transazioni.model';

const andamento: AndamentoTransazioni = {
  da: '2026-09-01',
  a: '2026-09-02',
  giorni: [
    { data: '2026-09-01', pagate: 1000, fallite: 30 },
    { data: '2026-09-02', pagate: 1200, fallite: 48 },
  ],
};

describe('andamentoToTimeSeries', () => {
  it('crea due serie con le label fornite e abilita area+zoom', () => {
    const s = andamentoToTimeSeries(andamento, { pagate: 'Pagate', fallite: 'Fallite' });
    expect(s.series.map((x) => x.name)).toEqual(['Pagate', 'Fallite']);
    expect(s.area).toBe(true);
    expect(s.zoom).toBe(true);
  });

  it('mappa i punti come [timestamp ms, valore]', () => {
    const s = andamentoToTimeSeries(andamento, { pagate: 'Pagate', fallite: 'Fallite' });
    expect(s.series[0].points[0]).toEqual({ t: Date.parse('2026-09-01T00:00:00Z'), y: 1000 });
    expect(s.series[1].points[1]).toEqual({ t: Date.parse('2026-09-02T00:00:00Z'), y: 48 });
  });

  it('applica un formattatore ai valori (raggruppamento migliaia locale-dipendente)', () => {
    const s = andamentoToTimeSeries(andamento, { pagate: 'Pagate', fallite: 'Fallite' });
    // Il separatore (`.`) dipende dall'ICU del runtime: in browser it-IT → "1.200".
    // Qui verifichiamo solo che il formatter preservi le cifre nell'ordine.
    expect(s.format?.(1200)).toMatch(/^1\D?200$/);
  });
});
