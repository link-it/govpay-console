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
import { ConsoleApiService, type ParamValue } from '@core/services';
import type { Slice } from '@core/models';
import type {
  Avviso,
  LinguaSecondaria,
  Pendenza,
  PendenzaSummary,
  PendenzeListFilters,
  RicevutaSummary,
  Soggetto,
} from './pendenza.model';

/**
 * Client API delle **Pendenze V2** (GovPay Console API), costruito sopra
 * {@link ConsoleApiService} (base `/govpay-console-api`, `Slice<T>`, RFC 7807).
 *
 * Unico client della feature Pendenze (il V1 `pendenze.api.ts` è stato rimosso
 * in Fase 5). Vedi `ANALISI-E-PIANO-LAVORO.md` §9.
 *
 * Path canonici (schema OpenAPI):
 * - `GET /pendenze` — lista paginata di `PendenzaSummary`;
 * - `GET /pendenze/{idA2A}/{idPendenza}` — dettaglio `Pendenza`
 *   (voci inline + `_links`); **non** passiamo `?expand=` (allegati/note esclusi);
 * - `GET …/informazioniDebitore` — `Soggetto` (on-demand, audit GDPR lato API);
 * - `GET …/ricevute` — lista `RicevutaSummary` (no paginazione);
 * - `GET …/avviso` — `Avviso` (JSON) o PDF (`Accept: application/pdf`).
 */
@Injectable({ providedIn: 'root' })
export class PendenzeConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** Compone il path `pendenze/{idA2A}/{idPendenza}[/sub…]` con segmenti encodati. */
  private path(idA2A: string, idPendenza: string, ...sub: string[]): string {
    return ['pendenze', encodeURIComponent(idA2A), encodeURIComponent(idPendenza), ...sub].join('/');
  }

  /**
   * `GET /pendenze` — lista paginata.
   * `filters` include i 4 filtri V2 + paginazione (`page`/`limit`/`sort`/`total`
   * oppure `cursor`). Le combinazioni non valide (es. `cursor`+`sort`) sono
   * respinte dal backend con 400: è responsabilità del chiamante non mescolarle.
   */
  list(filters: PendenzeListFilters = {}): Observable<Slice<PendenzaSummary>> {
    return this.api.list<PendenzaSummary>('pendenze', filters as Record<string, ParamValue>);
  }

  /** `GET /pendenze/{idA2A}/{idPendenza}` — dettaglio (senza `expand`). */
  get(idA2A: string, idPendenza: string): Observable<Pendenza> {
    return this.api.get<Pendenza>(this.path(idA2A, idPendenza));
  }

  /**
   * `GET …/informazioniDebitore` — anagrafica/contatti del debitore.
   * Da invocare **on-demand** (previo consenso): ogni 200 genera audit GDPR
   * `PENDENZA_VISUALIZZA_DEBITORE` lato API.
   */
  getInformazioniDebitore(idA2A: string, idPendenza: string): Observable<Soggetto> {
    return this.api.get<Soggetto>(this.path(idA2A, idPendenza, 'informazioniDebitore'));
  }

  /** `GET …/ricevute` — elenco (metadata-only) delle RT della pendenza. */
  listRicevute(idA2A: string, idPendenza: string): Observable<RicevutaSummary[]> {
    return this.api.get<RicevutaSummary[]>(this.path(idA2A, idPendenza, 'ricevute'));
  }

  /** `GET …/avviso` (`Accept: application/json`) — metadati locali dell'avviso. */
  getAvvisoJson(
    idA2A: string,
    idPendenza: string,
    linguaSecondaria?: LinguaSecondaria,
  ): Observable<Avviso> {
    return this.api.request<Avviso>('GET', this.path(idA2A, idPendenza, 'avviso'), {
      headers: { Accept: 'application/json' },
      params: { linguaSecondaria },
    });
  }

  /**
   * `GET …/avviso` (`Accept: application/pdf`) — stampa avviso (govpay-stampe).
   * Possibili errori dedicati: 422 (bollo telematico, PDF n/a), 502/503
   * (govpay-stampe ko / non configurato).
   */
  getAvvisoPdf(
    idA2A: string,
    idPendenza: string,
    linguaSecondaria?: LinguaSecondaria,
  ): Observable<Blob> {
    return this.api.getBlob(this.path(idA2A, idPendenza, 'avviso'), 'application/pdf', {
      linguaSecondaria,
    });
  }
}
