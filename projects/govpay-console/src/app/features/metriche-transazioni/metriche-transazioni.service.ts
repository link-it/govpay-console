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

import { Injectable } from '@angular/core';
import { type Observable, delay, of } from 'rxjs';
import type { AndamentoTransazioni, TransazioniGiorno } from './transazioni.model';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Fine periodo del mock (ancorata: nessuna dipendenza dall'orologio). */
const END_ISO = '2026-09-08';
const DAYS = 90;

/**
 * Genera una serie storica **deterministica** (nessun `Math.random`): volume
 * giornaliero con stagionalità settimanale, calo nei weekend e leggero trend
 * di crescita; falliti come piccola frazione variabile del pagato.
 */
function buildAndamento(): AndamentoTransazioni {
  const end = Date.parse(`${END_ISO}T00:00:00Z`);
  const giorni: TransazioniGiorno[] = [];
  for (let i = 0; i < DAYS; i++) {
    const ts = end - (DAYS - 1 - i) * DAY_MS;
    const dow = new Date(ts).getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 0.55 : 1;
    const stagionale = 1 + 0.18 * Math.sin((i / 7) * 2 * Math.PI);
    const trend = 1 + i * 0.004;
    const pagate = Math.round(900 * weekend * stagionale * trend);
    const fallite = Math.round(pagate * (0.03 + 0.02 * Math.abs(Math.sin(i / 5))));
    giorni.push({ data: new Date(ts).toISOString().slice(0, 10), pagate, fallite });
  }
  return { da: giorni[0].data, a: giorni[giorni.length - 1].data, giorni };
}

const MOCK_ANDAMENTO = buildAndamento();

/**
 * Sorgente dell'andamento storico delle transazioni per il pilota grafici.
 *
 * ⚠️ **MOCK.** Non esiste ancora un endpoint dedicato. Quando ci sarà, questo
 * service diventerà un client `ConsoleApiService` e cambierà solo la sorgente:
 * adapter, componente e grafico restano invariati.
 */
@Injectable({ providedIn: 'root' })
export class MetricheTransazioniService {
  /** Ritorna l'andamento delle transazioni del periodo (mock, latenza simulata). */
  getAndamento(): Observable<AndamentoTransazioni> {
    return of(MOCK_ANDAMENTO).pipe(delay(400));
  }
}
