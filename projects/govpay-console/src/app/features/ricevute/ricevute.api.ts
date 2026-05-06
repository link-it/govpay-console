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

import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import type { Pageable } from '@core/models';
import type { Ricevuta, RicevuteListFilters } from './ricevuta.model';

@Injectable({ providedIn: 'root' })
export class RicevuteApi {
  private readonly api = inject(ApiService);

  list(filters: RicevuteListFilters = {}): Observable<Pageable<Ricevuta>> {
    return this.api.list<Ricevuta>('ricevute', filters as Record<string, string | number | boolean | undefined>);
  }

  /**
   * `GET /rpp/{idDominio}/{iuv}/{ccp}` — detail della singola ricevuta
   * (RPP = Richiesta di Pagamento Pendenza).
   *
   * Per i pagamenti pagoPA recenti il CCP non è valorizzato: il backend
   * GovPay accetta convenzionalmente la stringa `n/a` (url-encoded
   * `n%2Fa`), come fa la console legacy
   * (`govpay-console-github/src/app/services/util.service.ts:849`).
   */
  get(idDominio: string, iuv: string, ccp?: string): Observable<Ricevuta> {
    const ccpSegment = ccp && ccp.trim() ? ccp : 'n/a';
    return this.api.raw<Ricevuta>(
      'GET',
      `/rpp/${encodeURIComponent(idDominio)}/${encodeURIComponent(iuv)}/${encodeURIComponent(ccpSegment)}`,
    );
  }
}
