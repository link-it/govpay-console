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
  Operatore,
  OperatoreCreate,
  OperatoreReplace,
  OperatoreSummary,
  OperatoriListFilters,
} from './operatore.model';

/**
 * Client API **Operatori V2** su {@link ConsoleApiService} (base
 * `/govpay-console-api`, `Slice<T>`, RFC 7807, ETag/If-Match). CRUD senza DELETE.
 * Id risorsa = `principal` (encodato nel path).
 */
@Injectable({ providedIn: 'root' })
export class OperatoriConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(principal: string): string {
    return `operatori/${encodeURIComponent(principal)}`;
  }

  /** `GET /operatori` — lista paginata. */
  list(filters: OperatoriListFilters = {}): Observable<Slice<OperatoreSummary>> {
    return this.api.list<OperatoreSummary>('operatori', filters as Record<string, ParamValue>);
  }

  /** `GET /operatori/{principal}` — dettaglio. */
  get(principal: string): Observable<Operatore> {
    return this.api.get<Operatore>(this.base(principal));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(principal: string): Observable<WithETag<Operatore>> {
    return this.api.getWithETag<Operatore>(this.base(principal));
  }

  /** `POST /operatori` — crea un operatore (201 + Location/ETag). */
  create(body: OperatoreCreate): Observable<Operatore> {
    return this.api.post<Operatore>('operatori', body).pipe(map((r) => r.body as Operatore));
  }

  /** `PUT /operatori/{principal}` — replace con `If-Match`. */
  replace(principal: string, body: OperatoreReplace, ifMatch: string | null): Observable<WithETag<Operatore>> {
    return this.api.put<Operatore>(this.base(principal), body, ifMatch);
  }
}
