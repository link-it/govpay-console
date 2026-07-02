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
  Connettore,
  ConnettoreCredenziali,
  Intermediario,
  IntermediarioCreate,
  IntermediarioReplace,
  IntermediarioSummary,
  IntermediariListFilters,
  Stazione,
  StazioneCreate,
  StazioneReplace,
  StazioneSummary,
  StazioniListFilters,
  TipoConnettore,
} from './intermediario.model';

/**
 * Client API **Intermediari V2** (Anagrafica PagoPA) su {@link ConsoleApiService}
 * (base `/govpay-console-api`, `Slice<T>`, RFC 7807).
 *
 * File transitorio parallelo al V1 `intermediari.api.ts`. Fase **read-first**:
 * qui sono implementati i soli metodi di **lettura**. I write (create/replace,
 * stazioni CRUD, connettori PUT + credenziali) arriveranno con l'infra
 * ETag/If-Match (vedi `ANALISI-E-PIANO.md` §7.5, Fase 5).
 */
@Injectable({ providedIn: 'root' })
export class IntermediariConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(idIntermediario: string, ...sub: string[]): string {
    return ['intermediari', encodeURIComponent(idIntermediario), ...sub].join('/');
  }

  /** `GET /intermediari` — lista paginata. */
  list(filters: IntermediariListFilters = {}): Observable<Slice<IntermediarioSummary>> {
    return this.api.list<IntermediarioSummary>('intermediari', filters as Record<string, ParamValue>);
  }

  /** `GET /intermediari/{idIntermediario}` — dettaglio. */
  get(idIntermediario: string): Observable<Intermediario> {
    return this.api.get<Intermediario>(this.base(idIntermediario));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(idIntermediario: string): Observable<WithETag<Intermediario>> {
    return this.api.getWithETag<Intermediario>(this.base(idIntermediario));
  }

  /** `POST /intermediari` — crea un intermediario (201 + Location/ETag). */
  create(body: IntermediarioCreate): Observable<Intermediario> {
    return this.api.post<Intermediario>('intermediari', body).pipe(map((r) => r.body as Intermediario));
  }

  /** `PUT /intermediari/{idIntermediario}` — replace con `If-Match`. */
  replace(
    idIntermediario: string,
    body: IntermediarioReplace,
    ifMatch: string | null,
  ): Observable<WithETag<Intermediario>> {
    return this.api.put<Intermediario>(this.base(idIntermediario), body, ifMatch);
  }

  /** `GET /intermediari/{idIntermediario}/stazioni` — lista paginata delle stazioni. */
  listStazioni(
    idIntermediario: string,
    filters: StazioniListFilters = {},
  ): Observable<Slice<StazioneSummary>> {
    return this.api.list<StazioneSummary>(
      this.base(idIntermediario, 'stazioni'),
      filters as Record<string, ParamValue>,
    );
  }

  /** `GET /intermediari/{idIntermediario}/stazioni/{idStazione}` — dettaglio stazione. */
  getStazione(idIntermediario: string, idStazione: string): Observable<Stazione> {
    return this.api.get<Stazione>(this.base(idIntermediario, 'stazioni', encodeURIComponent(idStazione)));
  }

  /**
   * `GET /intermediari/{idIntermediario}/connettori/{tipo}` — connettore
   * (senza credenziali). Lo slot esiste sempre (`abilitato=false` se non configurato).
   */
  getConnettore(idIntermediario: string, tipo: TipoConnettore): Observable<Connettore> {
    return this.api.get<Connettore>(this.base(idIntermediario, 'connettori', tipo));
  }

  /* ── Write: stazioni ─────────────────────────────────────────────── */

  /** `POST …/stazioni` — crea una stazione. */
  createStazione(idIntermediario: string, body: StazioneCreate): Observable<Stazione> {
    return this.api
      .post<Stazione>(this.base(idIntermediario, 'stazioni'), body)
      .pipe(map((r) => r.body as Stazione));
  }

  /** `GET …/stazioni/{idStazione}` con `ETag` (per la modifica). */
  getStazioneWithETag(idIntermediario: string, idStazione: string): Observable<WithETag<Stazione>> {
    return this.api.getWithETag<Stazione>(this.base(idIntermediario, 'stazioni', encodeURIComponent(idStazione)));
  }

  /** `PUT …/stazioni/{idStazione}` — replace con `If-Match`. */
  replaceStazione(
    idIntermediario: string,
    idStazione: string,
    body: StazioneReplace,
    ifMatch: string | null,
  ): Observable<WithETag<Stazione>> {
    return this.api.put<Stazione>(this.base(idIntermediario, 'stazioni', encodeURIComponent(idStazione)), body, ifMatch);
  }

  /* ── Write: connettori ───────────────────────────────────────────── */

  /** `GET …/connettori/{tipo}` con `ETag` (per la modifica). */
  getConnettoreWithETag(idIntermediario: string, tipo: TipoConnettore): Observable<WithETag<Connettore>> {
    return this.api.getWithETag<Connettore>(this.base(idIntermediario, 'connettori', tipo));
  }

  /** `PUT …/connettori/{tipo}` — replace config (senza credenziali) con `If-Match`. */
  replaceConnettore(
    idIntermediario: string,
    tipo: TipoConnettore,
    body: Connettore,
    ifMatch: string | null,
  ): Observable<WithETag<Connettore>> {
    return this.api.put<Connettore>(this.base(idIntermediario, 'connettori', tipo), body, ifMatch);
  }

  /** `PUT …/connettori/{tipo}/credenziali` — credenziali write-only (204). */
  putConnettoreCredenziali(
    idIntermediario: string,
    tipo: TipoConnettore,
    body: ConnettoreCredenziali,
  ): Observable<void> {
    return this.api.putVoid(this.base(idIntermediario, 'connettori', tipo, 'credenziali'), body);
  }
}
