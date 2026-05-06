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
import type { Tracciato, TracciatiListFilters } from './tracciato.model';

@Injectable({ providedIn: 'root' })
export class TracciatiApi {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(filters: TracciatiListFilters = {}): Observable<Pageable<Tracciato>> {
    return this.api.list<Tracciato>(
      'tracciati',
      filters as Record<string, string | number | boolean | undefined>
    );
  }

  /**
   * `GET /pendenze/tracciati/{id}` — detail del tracciato (estende l'index
   * con il `contenuto` originale, qui non popolato per dimensione).
   */
  get(id: number | string): Observable<Tracciato> {
    const url = this.api.urlFor('tracciati', String(id));
    return this.http.get<Tracciato>(url);
  }
}
