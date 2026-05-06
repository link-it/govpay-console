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
import type { Dominio, DominiListFilters } from './dominio.model';

@Injectable({ providedIn: 'root' })
export class DominiApi {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(filters: DominiListFilters = {}): Observable<Pageable<Dominio>> {
    return this.api.list<Dominio>(
      'domini',
      filters as Record<string, string | number | boolean | undefined>
    );
  }

  /** `GET /domini/{idDominio}` — detail. */
  get(idDominio: string): Observable<Dominio> {
    const url = this.api.urlFor('domini', idDominio);
    return this.http.get<Dominio>(url);
  }

  /** `PUT /domini/{idDominio}` — crea o aggiorna. */
  save(idDominio: string, body: Partial<Dominio>): Observable<Dominio> {
    const url = this.api.urlFor('domini', idDominio);
    return this.http.put<Dominio>(url, body);
  }
}
