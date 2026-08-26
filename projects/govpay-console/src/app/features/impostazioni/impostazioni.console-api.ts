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
import { ConsoleApiService, type WithETag } from '@core/services';
import type { ConnettoreCredenziali } from '@core/models';
import type {
  ImpostazioniAppIoServer,
  ImpostazioniAppIoTemplatePromemoria,
  ImpostazioniGiornaleEventi,
  ImpostazioniHardening,
  ImpostazioniHardeningCredenziali,
  ImpostazioniMailServer,
  ImpostazioniMailServerCredenziali,
  ImpostazioniMailTemplatePromemoria,
  ImpostazioniOverview,
  ImpostazioniServizioGDE,
  ImpostazioniTracciatiCsv,
} from './impostazioni.model';

/**
 * Client API **Impostazioni V2** su {@link ConsoleApiService}. Overview delle
 * aree + le 8 sotto-risorse singleton (GET con ETag → PUT-replace con If-Match).
 * I segreti (password/credenziali) sono su endpoint dedicati write-only
 * (`putVoid`, 204) e non tornano mai dalle GET.
 *
 * NB: lo standard di salvataggio è **PUT-replace** dell'intero oggetto: è
 * sicuro perché i segreti vivono su endpoint separati (il round-trip GET→PUT
 * non li tocca). Il `patch()` JSON Patch resta disponibile su
 * `ConsoleApiService` per gli update a blocco previsti dallo spec.
 */
@Injectable({ providedIn: 'root' })
export class ImpostazioniConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** `GET /impostazioni` — overview delle aree. */
  overview(): Observable<ImpostazioniOverview> {
    return this.api.get<ImpostazioniOverview>('impostazioni');
  }

  /* ── servizioGDE ────────────────────────────────────────────────── */
  getServizioGde(): Observable<WithETag<ImpostazioniServizioGDE>> {
    return this.api.getWithETag<ImpostazioniServizioGDE>('impostazioni/servizioGDE');
  }
  putServizioGde(body: ImpostazioniServizioGDE, ifMatch?: string | null): Observable<WithETag<ImpostazioniServizioGDE>> {
    return this.api.put<ImpostazioniServizioGDE>('impostazioni/servizioGDE', body, ifMatch);
  }
  putServizioGdeCredenziali(body: ConnettoreCredenziali): Observable<void> {
    return this.api.putVoid('impostazioni/servizioGDE/credenziali', body);
  }

  /* ── giornale-eventi ────────────────────────────────────────────── */
  getGiornaleEventi(): Observable<WithETag<ImpostazioniGiornaleEventi>> {
    return this.api.getWithETag<ImpostazioniGiornaleEventi>('impostazioni/giornale-eventi');
  }
  putGiornaleEventi(body: ImpostazioniGiornaleEventi, ifMatch?: string | null): Observable<WithETag<ImpostazioniGiornaleEventi>> {
    return this.api.put<ImpostazioniGiornaleEventi>('impostazioni/giornale-eventi', body, ifMatch);
  }

  /* ── mail/server ────────────────────────────────────────────────── */
  getMailServer(): Observable<WithETag<ImpostazioniMailServer>> {
    return this.api.getWithETag<ImpostazioniMailServer>('impostazioni/mail/server');
  }
  putMailServer(body: ImpostazioniMailServer, ifMatch?: string | null): Observable<WithETag<ImpostazioniMailServer>> {
    return this.api.put<ImpostazioniMailServer>('impostazioni/mail/server', body, ifMatch);
  }
  putMailServerPassword(body: ImpostazioniMailServerCredenziali): Observable<void> {
    return this.api.putVoid('impostazioni/mail/server/password', body);
  }

  /* ── mail/template-promemoria ───────────────────────────────────── */
  getMailTemplate(): Observable<WithETag<ImpostazioniMailTemplatePromemoria>> {
    return this.api.getWithETag<ImpostazioniMailTemplatePromemoria>('impostazioni/mail/template-promemoria');
  }
  putMailTemplate(body: ImpostazioniMailTemplatePromemoria, ifMatch?: string | null): Observable<WithETag<ImpostazioniMailTemplatePromemoria>> {
    return this.api.put<ImpostazioniMailTemplatePromemoria>('impostazioni/mail/template-promemoria', body, ifMatch);
  }

  /* ── app-io/server ──────────────────────────────────────────────── */
  getAppIoServer(): Observable<WithETag<ImpostazioniAppIoServer>> {
    return this.api.getWithETag<ImpostazioniAppIoServer>('impostazioni/app-io/server');
  }
  putAppIoServer(body: ImpostazioniAppIoServer, ifMatch?: string | null): Observable<WithETag<ImpostazioniAppIoServer>> {
    return this.api.put<ImpostazioniAppIoServer>('impostazioni/app-io/server', body, ifMatch);
  }
  putAppIoServerCredenziali(body: ConnettoreCredenziali): Observable<void> {
    return this.api.putVoid('impostazioni/app-io/server/credenziali', body);
  }

  /* ── app-io/template-promemoria ─────────────────────────────────── */
  getAppIoTemplate(): Observable<WithETag<ImpostazioniAppIoTemplatePromemoria>> {
    return this.api.getWithETag<ImpostazioniAppIoTemplatePromemoria>('impostazioni/app-io/template-promemoria');
  }
  putAppIoTemplate(body: ImpostazioniAppIoTemplatePromemoria, ifMatch?: string | null): Observable<WithETag<ImpostazioniAppIoTemplatePromemoria>> {
    return this.api.put<ImpostazioniAppIoTemplatePromemoria>('impostazioni/app-io/template-promemoria', body, ifMatch);
  }

  /* ── tracciati-csv ──────────────────────────────────────────────── */
  getTracciatiCsv(): Observable<WithETag<ImpostazioniTracciatiCsv>> {
    return this.api.getWithETag<ImpostazioniTracciatiCsv>('impostazioni/tracciati-csv');
  }
  putTracciatiCsv(body: ImpostazioniTracciatiCsv, ifMatch?: string | null): Observable<WithETag<ImpostazioniTracciatiCsv>> {
    return this.api.put<ImpostazioniTracciatiCsv>('impostazioni/tracciati-csv', body, ifMatch);
  }

  /* ── hardening ──────────────────────────────────────────────────── */
  getHardening(): Observable<WithETag<ImpostazioniHardening>> {
    return this.api.getWithETag<ImpostazioniHardening>('impostazioni/hardening');
  }
  putHardening(body: ImpostazioniHardening, ifMatch?: string | null): Observable<WithETag<ImpostazioniHardening>> {
    return this.api.put<ImpostazioniHardening>('impostazioni/hardening', body, ifMatch);
  }
  putHardeningCredenziali(body: ImpostazioniHardeningCredenziali): Observable<void> {
    return this.api.putVoid('impostazioni/hardening/credenziali', body);
  }
}
