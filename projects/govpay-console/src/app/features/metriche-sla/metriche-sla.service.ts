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
import type { SlaResponse } from './sla.model';

/**
 * Dati SLA di esempio (4 metodi PA). Copre i tre stati: OK, KO (sotto soglia)
 * e WARNING con `conformitaOsservata: null` (nessun dato nel periodo), così il
 * pilota grafico esercita anche il ramo "n/d".
 */
const MOCK_SLA: SlaResponse = {
  periodo: { da: '2026-09-01', a: '2026-09-08' },
  kpi: [
    { codice: 'TDP', metodo: 'paDemandPaymentNotice', sogliaSecondi: 2.0, sogliaPercentile: 98, conformitaOsservata: 99.2, totale: 18432, sopraSoglia: 148, stato: 'OK' },
    { codice: 'TGP', metodo: 'paGetPayment', sogliaSecondi: 2.0, sogliaPercentile: 98, conformitaOsservata: 96.1, totale: 15201, sopraSoglia: 593, stato: 'KO' },
    { codice: 'TSRT', metodo: 'paSendRT', sogliaSecondi: 2.0, sogliaPercentile: 98, conformitaOsservata: 98.7, totale: 14980, sopraSoglia: 195, stato: 'OK' },
    { codice: 'TVP', metodo: 'paVerifyPayment', sogliaSecondi: 2.0, sogliaPercentile: 98, conformitaOsservata: null, totale: 0, sopraSoglia: 0, stato: 'WARNING' },
  ],
};

/**
 * Sorgente delle metriche SLA per il pilota grafici.
 *
 * ⚠️ **MOCK.** L'endpoint `GET /metriche/sla` (openapi-20260908) non è ancora
 * disponibile sul backend. Quando lo sarà, sostituire `getSla()` con:
 *
 * ```ts
 * this.consoleApi.get<SlaResponse>('metriche/sla', { dataDa, dataA });
 * ```
 *
 * La forma di `SlaResponse` è già quella dello spec, quindi cambia solo la
 * sorgente: adapter, componente e grafico restano invariati.
 */
@Injectable({ providedIn: 'root' })
export class MetricheSlaService {
  /** Ritorna le metriche SLA del periodo (mock, con latenza simulata). */
  getSla(): Observable<SlaResponse> {
    return of(MOCK_SLA).pipe(delay(400));
  }
}
