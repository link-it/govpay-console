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
import type { Evento, EventoDetail, GiornaleEventiListFilters } from './evento.model';

@Injectable({ providedIn: 'root' })
export class GiornaleEventiApi {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(filters: GiornaleEventiListFilters = {}): Observable<Pageable<Evento>> {
    return this.api.list<Evento>(
      'giornaleEventi',
      filters as Record<string, string | number | boolean | undefined>
    );
  }

  /** `GET /eventi/{id}` — detail con `parametriRichiesta`/`parametriRisposta`. */
  get(id: string | number): Observable<EventoDetail> {
    const url = this.api.urlFor('giornaleEventi', String(id));
    return this.http.get<EventoDetail>(url);
  }
}
