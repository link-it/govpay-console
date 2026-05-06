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
import { HttpClient } from '@angular/common/http';
import { type Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import type { Pageable } from '@core/models';
import type {
  Rendicontazione,
  RendicontazioneDetail,
  RendicontazioniListFilters,
} from './rendicontazione.model';

@Injectable({ providedIn: 'root' })
export class RendicontazioniApi {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(filters: RendicontazioniListFilters = {}): Observable<Pageable<Rendicontazione>> {
    return this.api.list<Rendicontazione>(
      'rendicontazioni',
      filters as Record<string, string | number | boolean | undefined>
    );
  }

  /**
   * `GET /flussiRendicontazione/{idDominio}/{idFlusso}/{dataFlusso}` —
   * dettaglio del flusso, con `segnalazioni` ed elenco delle
   * `rendicontazioni` contenute. Il path canonico GovPay (vedi legacy
   * `govpay-console-github` `rendicontazioni-view.component.ts:43`)
   * richiede tutti e tre i segmenti perché flussi diversi possono
   * condividere lo stesso `idFlusso` su domini/date differenti.
   *
   * Formato `dataFlusso`: `YYYY-MM-DDTHH:MM` (es. `2025-04-25T00:00`),
   * niente secondi/millisecondi/offset. Se viene passato un ISO
   * completo lo tronchiamo automaticamente a 16 caratteri.
   */
  get(idDominio: string, idFlusso: string, dataFlusso: string): Observable<RendicontazioneDetail> {
    const dataNorm = dataFlusso.slice(0, 16);
    const url = this.api.urlFor(
      'rendicontazioni',
      encodeURIComponent(idDominio),
      encodeURIComponent(idFlusso),
      dataNorm, // contiene `:` ma non va encoded — il backend si aspetta il letterale
    );
    return this.http.get<RendicontazioneDetail>(url);
  }
}
