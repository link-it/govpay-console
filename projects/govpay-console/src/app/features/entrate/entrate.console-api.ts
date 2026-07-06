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
  Entrata,
  EntrataCreate,
  EntrataReplace,
  EntrataSummary,
  EntrateListFilters,
} from './entrata.model';

/**
 * Client API **Entrate V2** (tipologie di entrata globali) su
 * {@link ConsoleApiService} (base `/govpay-console-api`, `Slice<T>`, RFC 7807,
 * ETag/If-Match). CRUD senza DELETE (nessuna cancellazione lato spec).
 */
@Injectable({ providedIn: 'root' })
export class EntrateConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(idEntrata: string): string {
    return `entrate/${encodeURIComponent(idEntrata)}`;
  }

  /** `GET /entrate` — lista paginata. */
  list(filters: EntrateListFilters = {}): Observable<Slice<EntrataSummary>> {
    return this.api.list<EntrataSummary>('entrate', filters as Record<string, ParamValue>);
  }

  /** `GET /entrate/{idEntrata}` — dettaglio. */
  get(idEntrata: string): Observable<Entrata> {
    return this.api.get<Entrata>(this.base(idEntrata));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(idEntrata: string): Observable<WithETag<Entrata>> {
    return this.api.getWithETag<Entrata>(this.base(idEntrata));
  }

  /** `POST /entrate` — crea un'entrata (201 + Location/ETag). */
  create(body: EntrataCreate): Observable<Entrata> {
    return this.api.post<Entrata>('entrate', body).pipe(map((r) => r.body as Entrata));
  }

  /** `PUT /entrate/{idEntrata}` — replace con `If-Match`. */
  replace(idEntrata: string, body: EntrataReplace, ifMatch: string | null): Observable<WithETag<Entrata>> {
    return this.api.put<Entrata>(this.base(idEntrata), body, ifMatch);
  }
}
