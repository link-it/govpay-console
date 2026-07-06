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
import type { Slice, ConnettoreCredenziali } from '@core/models';
import type { ConnettoreDominio, ConnettoreDominioTipo } from './connettore-dominio.model';
import type {
  ContoAccredito,
  ContoAccreditoCreate,
  ContoAccreditoReplace,
  ContoAccreditoSummary,
  Dominio,
  DominioCreate,
  DominioReplace,
  DominioSummary,
  DominiListFilters,
  EntrataDominio,
  EntrataDominioCreate,
  EntrataDominioReplace,
  EntrataDominioSummary,
  TipoPendenzaDominio,
  TipoPendenzaDominioCreate,
  TipoPendenzaDominioReplace,
  TipoPendenzaDominioSummary,
  UnitaOperativa,
  UnitaOperativaCreate,
  UnitaOperativaReplace,
  UnitaOperativaSummary,
} from './dominio.model';

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

  /* ── Unità operative (sub-resource) ──────────────────────────────── */

  listUnitaOperative(idDominio: string, filters: Record<string, ParamValue> = {}): Observable<Slice<UnitaOperativaSummary>> {
    return this.api.list<UnitaOperativaSummary>(this.base(idDominio, 'unitaOperative'), filters);
  }

  getUnitaOperativaWithETag(idDominio: string, idUo: string): Observable<WithETag<UnitaOperativa>> {
    return this.api.getWithETag<UnitaOperativa>(this.base(idDominio, 'unitaOperative', encodeURIComponent(idUo)));
  }

  createUnitaOperativa(idDominio: string, body: UnitaOperativaCreate): Observable<UnitaOperativa> {
    return this.api.post<UnitaOperativa>(this.base(idDominio, 'unitaOperative'), body).pipe(map((r) => r.body as UnitaOperativa));
  }

  replaceUnitaOperativa(idDominio: string, idUo: string, body: UnitaOperativaReplace, ifMatch: string | null): Observable<WithETag<UnitaOperativa>> {
    return this.api.put<UnitaOperativa>(this.base(idDominio, 'unitaOperative', encodeURIComponent(idUo)), body, ifMatch);
  }

  /* ── Conti di accredito (sub-resource) ───────────────────────────── */

  listContiAccredito(idDominio: string, filters: Record<string, ParamValue> = {}): Observable<Slice<ContoAccreditoSummary>> {
    return this.api.list<ContoAccreditoSummary>(this.base(idDominio, 'contiAccredito'), filters);
  }

  getContoAccreditoWithETag(idDominio: string, iban: string): Observable<WithETag<ContoAccredito>> {
    return this.api.getWithETag<ContoAccredito>(this.base(idDominio, 'contiAccredito', encodeURIComponent(iban)));
  }

  createContoAccredito(idDominio: string, body: ContoAccreditoCreate): Observable<ContoAccredito> {
    return this.api.post<ContoAccredito>(this.base(idDominio, 'contiAccredito'), body).pipe(map((r) => r.body as ContoAccredito));
  }

  replaceContoAccredito(idDominio: string, iban: string, body: ContoAccreditoReplace, ifMatch: string | null): Observable<WithETag<ContoAccredito>> {
    return this.api.put<ContoAccredito>(this.base(idDominio, 'contiAccredito', encodeURIComponent(iban)), body, ifMatch);
  }

  /* ── Entrate del dominio (sub-resource) ──────────────────────────── */

  listEntrate(idDominio: string, filters: Record<string, ParamValue> = {}): Observable<Slice<EntrataDominioSummary>> {
    return this.api.list<EntrataDominioSummary>(this.base(idDominio, 'entrate'), filters);
  }

  getEntrataWithETag(idDominio: string, idEntrata: string): Observable<WithETag<EntrataDominio>> {
    return this.api.getWithETag<EntrataDominio>(this.base(idDominio, 'entrate', encodeURIComponent(idEntrata)));
  }

  createEntrata(idDominio: string, body: EntrataDominioCreate): Observable<EntrataDominio> {
    return this.api.post<EntrataDominio>(this.base(idDominio, 'entrate'), body).pipe(map((r) => r.body as EntrataDominio));
  }

  replaceEntrata(idDominio: string, idEntrata: string, body: EntrataDominioReplace, ifMatch: string | null): Observable<WithETag<EntrataDominio>> {
    return this.api.put<EntrataDominio>(this.base(idDominio, 'entrate', encodeURIComponent(idEntrata)), body, ifMatch);
  }

  /* ── Tipi pendenza del dominio (sub-resource) ────────────────────── */

  listTipiPendenza(idDominio: string, filters: Record<string, ParamValue> = {}): Observable<Slice<TipoPendenzaDominioSummary>> {
    return this.api.list<TipoPendenzaDominioSummary>(this.base(idDominio, 'tipiPendenza'), filters);
  }

  getTipoPendenzaWithETag(idDominio: string, idTipoPendenza: string): Observable<WithETag<TipoPendenzaDominio>> {
    return this.api.getWithETag<TipoPendenzaDominio>(this.base(idDominio, 'tipiPendenza', encodeURIComponent(idTipoPendenza)));
  }

  createTipoPendenza(idDominio: string, body: TipoPendenzaDominioCreate): Observable<TipoPendenzaDominio> {
    return this.api.post<TipoPendenzaDominio>(this.base(idDominio, 'tipiPendenza'), body).pipe(map((r) => r.body as TipoPendenzaDominio));
  }

  replaceTipoPendenza(idDominio: string, idTipoPendenza: string, body: TipoPendenzaDominioReplace, ifMatch: string | null): Observable<WithETag<TipoPendenzaDominio>> {
    return this.api.put<TipoPendenzaDominio>(this.base(idDominio, 'tipiPendenza', encodeURIComponent(idTipoPendenza)), body, ifMatch);
  }

  /* ── Connettori del dominio (singleton per tipo) ─────────────────── */

  getConnettoreWithETag(idDominio: string, tipo: ConnettoreDominioTipo): Observable<WithETag<ConnettoreDominio>> {
    return this.api.getWithETag<ConnettoreDominio>(this.base(idDominio, 'connettori', tipo));
  }

  replaceConnettore(idDominio: string, tipo: ConnettoreDominioTipo, body: ConnettoreDominio, ifMatch: string | null): Observable<WithETag<ConnettoreDominio>> {
    return this.api.put<ConnettoreDominio>(this.base(idDominio, 'connettori', tipo), body, ifMatch);
  }

  /** `PUT …/connettori/{tipo}/credenziali` — credenziali write-only (204). */
  putCredenzialiConnettore(idDominio: string, tipo: ConnettoreDominioTipo, body: ConnettoreCredenziali): Observable<void> {
    return this.api.putVoid(this.base(idDominio, 'connettori', tipo, 'credenziali'), body);
  }
}
