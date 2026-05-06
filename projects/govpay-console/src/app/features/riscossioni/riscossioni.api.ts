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
import type { Riscossione, RiscossioniListFilters } from './riscossione.model';

@Injectable({ providedIn: 'root' })
export class RiscossioniApi {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(filters: RiscossioniListFilters = {}): Observable<Pageable<Riscossione>> {
    return this.api.list<Riscossione>(
      'riscossioni',
      filters as Record<string, string | number | boolean | undefined>
    );
  }

  /**
   * `GET /riscossioni/{idDominio}/{iuv}/{iur}/{indice}` — dettaglio della
   * singola riscossione (response = `riscossione` schema, comprende
   * `vocePendenza`).
   */
  get(idDominio: string, iuv: string, iur: string, indice: number): Observable<Riscossione> {
    const url = this.api.urlFor('riscossioni', idDominio, iuv, iur, String(indice));
    return this.http.get<Riscossione>(url);
  }
}
