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
import type { Dominio, DominioCreate, DominioReplace, DominioSummary, DominiListFilters } from './dominio.model';

/**
 * Client API **Domini V2** (enti creditori) su {@link ConsoleApiService} (base
 * `/govpay-console-api`, `Slice<T>`, RFC 7807, ETag/If-Match). CRUD senza DELETE
 * sull'entità; il logo è binario (GET/PUT/DELETE). Le altre sotto-risorse
 * (unità operative, conti accredito, entrate, tipi pendenza, connettori) sono in
 * client dedicati.
 */
@Injectable({ providedIn: 'root' })
export class DominiConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(idDominio: string, ...sub: string[]): string {
    return ['domini', encodeURIComponent(idDominio), ...sub].join('/');
  }

  /** `GET /domini` — lista paginata. */
  list(filters: DominiListFilters = {}): Observable<Slice<DominioSummary>> {
    return this.api.list<DominioSummary>('domini', filters as Record<string, ParamValue>);
  }

  /** `GET /domini/{idDominio}` — dettaglio. */
  get(idDominio: string): Observable<Dominio> {
    return this.api.get<Dominio>(this.base(idDominio));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(idDominio: string): Observable<WithETag<Dominio>> {
    return this.api.getWithETag<Dominio>(this.base(idDominio));
  }

  /** `POST /domini` — crea un dominio (201 + Location/ETag). */
  create(body: DominioCreate): Observable<Dominio> {
    return this.api.post<Dominio>('domini', body).pipe(map((r) => r.body as Dominio));
  }

  /** `PUT /domini/{idDominio}` — replace con `If-Match`. */
  replace(idDominio: string, body: DominioReplace, ifMatch: string | null): Observable<WithETag<Dominio>> {
    return this.api.put<Dominio>(this.base(idDominio), body, ifMatch);
  }

  /* ── Logo (binario) ──────────────────────────────────────────────── */

  /** `GET /domini/{idDominio}/logo` — logo (png/jpeg) come Blob. */
  getLogo(idDominio: string): Observable<Blob> {
    return this.api.getBlob(this.base(idDominio, 'logo'), 'image/png,image/jpeg');
  }

  /** `PUT /domini/{idDominio}/logo` — upload/sostituzione logo (≤256KB). */
  putLogo(idDominio: string, blob: Blob): Observable<void> {
    return this.api.putBlob(this.base(idDominio, 'logo'), blob, blob.type || 'image/png');
  }

  /** `DELETE /domini/{idDominio}/logo` — rimozione logo (204 idempotente). */
  deleteLogo(idDominio: string): Observable<void> {
    return this.api.delete(this.base(idDominio, 'logo'));
  }
}
