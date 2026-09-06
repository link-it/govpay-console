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
import { map, type Observable } from 'rxjs';
import { ConsoleApiService, type ParamValue, type WithETag } from '@core/services';
import type { Slice } from '@core/models';
import type { Ruolo, RuoloCreate, RuoloReplace, RuoloSummary, RuoliListFilters } from './ruolo.model';

/**
 * Client API **Ruoli V2** (catalogo ruoli) su {@link ConsoleApiService}
 * (base `/govpay-console-api`, `Slice<T>`, RFC 7807, ETag/If-Match).
 * CRUD senza DELETE.
 */
@Injectable({ providedIn: 'root' })
export class RuoliConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(idRuolo: string): string {
    return `ruoli/${encodeURIComponent(idRuolo)}`;
  }

  /** `GET /ruoli` — lista paginata. */
  list(filters: RuoliListFilters = {}): Observable<Slice<RuoloSummary>> {
    return this.api.list<RuoloSummary>('ruoli', filters as Record<string, ParamValue>);
  }

  /** `GET /ruoli/{idRuolo}` — dettaglio. */
  get(idRuolo: string): Observable<Ruolo> {
    return this.api.get<Ruolo>(this.base(idRuolo));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(idRuolo: string): Observable<WithETag<Ruolo>> {
    return this.api.getWithETag<Ruolo>(this.base(idRuolo));
  }

  /** `POST /ruoli` — crea un ruolo (201 + Location/ETag). */
  create(body: RuoloCreate): Observable<Ruolo> {
    return this.api.post<Ruolo>('ruoli', body).pipe(map((r) => r.body as Ruolo));
  }

  /** `PUT /ruoli/{idRuolo}` — replace con `If-Match`. */
  replace(idRuolo: string, body: RuoloReplace, ifMatch: string | null): Observable<WithETag<Ruolo>> {
    return this.api.put<Ruolo>(this.base(idRuolo), body, ifMatch);
  }
}
