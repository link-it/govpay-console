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
import type { Pendenza, PendenzeListFilters } from './pendenza.model';

/**
 * Client API per le Pendenze.
 *
 * Usa `ApiService` come wrapper di `HttpClient` (URL base + parametri tipizzati).
 * Endpoint canonico: `/govpay-api-backoffice/rs/form/v1/pendenze`.
 */
@Injectable({ providedIn: 'root' })
export class PendenzeApi {
  private readonly api = inject(ApiService);

  list(filters: PendenzeListFilters = {}): Observable<Pageable<Pendenza>> {
    return this.api.list<Pendenza>('pendenze', filters as Record<string, string | number | boolean | undefined>);
  }

  /**
   * `GET /pendenze/{idA2A}/{idPendenza}` — detail canonico per chiave A2A.
   */
  get(idA2A: string, idPendenza: string): Observable<Pendenza> {
    return this.api.raw<Pendenza>(
      'GET',
      `/pendenze/${encodeURIComponent(idA2A)}/${encodeURIComponent(idPendenza)}`,
    );
  }

  /**
   * `GET /pendenze/byAvviso/{idDominio}/{numeroAvviso}` — detail per avviso.
   */
  getByAvviso(idDominio: string, numeroAvviso: string): Observable<Pendenza> {
    return this.api.raw<Pendenza>(
      'GET',
      `/pendenze/byAvviso/${encodeURIComponent(idDominio)}/${encodeURIComponent(numeroAvviso)}`,
    );
  }
}
