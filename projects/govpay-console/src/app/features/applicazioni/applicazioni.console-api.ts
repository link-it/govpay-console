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
import type { ConnettoreCredenziali, Slice } from '@core/models';
import type {
  Applicazione,
  ApplicazioneCreate,
  ApplicazioneReplace,
  ApplicazioneSummary,
  ApplicazioniListFilters,
  ConnettoreIntegrazioneApplicazione,
} from './applicazione.model';

/**
 * Client API **Applicazioni V2** su {@link ConsoleApiService} (base
 * `/govpay-console-api`, `Slice<T>`, RFC 7807, ETag/If-Match). CRUD senza DELETE
 * + sub-resource connettore-integrazione (singleton GET/PUT + credenziali).
 */
@Injectable({ providedIn: 'root' })
export class ApplicazioniConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private base(idA2A: string, ...sub: string[]): string {
    return ['applicazioni', encodeURIComponent(idA2A), ...sub].join('/');
  }

  /** `GET /applicazioni` — lista paginata. */
  list(filters: ApplicazioniListFilters = {}): Observable<Slice<ApplicazioneSummary>> {
    return this.api.list<ApplicazioneSummary>('applicazioni', filters as Record<string, ParamValue>);
  }

  /** `GET /applicazioni/{idA2A}` — dettaglio. */
  get(idA2A: string): Observable<Applicazione> {
    return this.api.get<Applicazione>(this.base(idA2A));
  }

  /** `GET` dettaglio con `ETag` (per il flusso di modifica con `If-Match`). */
  getWithETag(idA2A: string): Observable<WithETag<Applicazione>> {
    return this.api.getWithETag<Applicazione>(this.base(idA2A));
  }

  /** `POST /applicazioni` — crea (201 + Location/ETag). */
  create(body: ApplicazioneCreate): Observable<Applicazione> {
    return this.api.post<Applicazione>('applicazioni', body).pipe(map((r) => r.body as Applicazione));
  }

  /** `PUT /applicazioni/{idA2A}` — replace con `If-Match`. */
  replace(idA2A: string, body: ApplicazioneReplace, ifMatch: string | null): Observable<WithETag<Applicazione>> {
    return this.api.put<Applicazione>(this.base(idA2A), body, ifMatch);
  }

  /** `PUT /applicazioni/{idA2A}/password` — imposta la password (HTTP Basic), write-only (204). */
  putPassword(idA2A: string, nuovaPassword: string): Observable<void> {
    return this.api.putVoid(this.base(idA2A, 'password'), { nuovaPassword });
  }

  /* ── Connettore integrazione (singleton) ─────────────────────────── */

  /** `GET …/connettore-integrazione` (senza credenziali). */
  getConnettoreIntegrazione(idA2A: string): Observable<ConnettoreIntegrazioneApplicazione> {
    return this.api.get<ConnettoreIntegrazioneApplicazione>(this.base(idA2A, 'connettore-integrazione'));
  }

  /** `GET …/connettore-integrazione` con `ETag` (per la modifica). */
  getConnettoreIntegrazioneWithETag(idA2A: string): Observable<WithETag<ConnettoreIntegrazioneApplicazione>> {
    return this.api.getWithETag<ConnettoreIntegrazioneApplicazione>(this.base(idA2A, 'connettore-integrazione'));
  }

  /** `PUT …/connettore-integrazione` — replace config con `If-Match`. */
  replaceConnettoreIntegrazione(
    idA2A: string,
    body: ConnettoreIntegrazioneApplicazione,
    ifMatch: string | null,
  ): Observable<WithETag<ConnettoreIntegrazioneApplicazione>> {
    return this.api.put<ConnettoreIntegrazioneApplicazione>(this.base(idA2A, 'connettore-integrazione'), body, ifMatch);
  }

  /** `PUT …/connettore-integrazione/credenziali` — credenziali write-only (204). */
  putConnettoreIntegrazioneCredenziali(idA2A: string, body: ConnettoreCredenziali): Observable<void> {
    return this.api.putVoid(this.base(idA2A, 'connettore-integrazione', 'credenziali'), body);
  }
}
