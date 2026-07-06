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
import type {
  TipoPendenza,
  TipoPendenzaCreate,
  TipoPendenzaReplace,
  TipoPendenzaSummary,
  TipiPendenzaListFilters,
} from './tipo-pendenza.model';

/**
 * Client API **TipiPendenza V2** (tipologie di pendenza globali) su
 * {@link ConsoleApiService} (base `/govpay-console-api`, `Slice<T>`, RFC 7807,
 * ETag/If-Match). CRUD senza DELETE.
 */
@Injectable({ providedIn: 'root' })
export class TipiPendenzaConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(idTipoPendenza: string): string {
    return `tipiPendenza/${encodeURIComponent(idTipoPendenza)}`;
  }

  /** `GET /tipiPendenza` — lista paginata. */
  list(filters: TipiPendenzaListFilters = {}): Observable<Slice<TipoPendenzaSummary>> {
    return this.api.list<TipoPendenzaSummary>('tipiPendenza', filters as Record<string, ParamValue>);
  }

  /** `GET /tipiPendenza/{idTipoPendenza}` — dettaglio. */
  get(idTipoPendenza: string): Observable<TipoPendenza> {
    return this.api.get<TipoPendenza>(this.base(idTipoPendenza));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(idTipoPendenza: string): Observable<WithETag<TipoPendenza>> {
    return this.api.getWithETag<TipoPendenza>(this.base(idTipoPendenza));
  }

  /** `POST /tipiPendenza` — crea una tipologia (201 + Location/ETag). */
  create(body: TipoPendenzaCreate): Observable<TipoPendenza> {
    return this.api.post<TipoPendenza>('tipiPendenza', body).pipe(map((r) => r.body as TipoPendenza));
  }

  /** `PUT /tipiPendenza/{idTipoPendenza}` — replace con `If-Match`. */
  replace(
    idTipoPendenza: string,
    body: TipoPendenzaReplace,
    ifMatch: string | null,
  ): Observable<WithETag<TipoPendenza>> {
    return this.api.put<TipoPendenza>(this.base(idTipoPendenza), body, ifMatch);
  }
}
