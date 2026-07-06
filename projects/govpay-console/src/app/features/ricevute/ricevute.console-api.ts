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
import type { Ricevuta, RicevutaFormato, RicevutaSummary, RicevuteListFilters } from './ricevuta.model';

const ACCEPT_BY_FORMATO: Record<RicevutaFormato, string> = {
  json: 'application/json',
  xml: 'application/xml',
  pdf: 'application/pdf',
};

/**
 * Client API **Ricevute V2** (RT) su {@link ConsoleApiService} (base
 * `/govpay-console-api`, `Slice<T>`, RFC 7807). Consultazione read-only: lista,
 * dettaglio per tupla `(idDominio, iuv, idRicevuta)` e download dei sub-resource
 * `rpt` (json/xml) e `rt` (json/xml/pdf) come Blob.
 */
@Injectable({ providedIn: 'root' })
export class RicevuteConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** Compone il path `ricevute/{idDominio}/{iuv}/{idRicevuta}[/sub…]`. */
  private path(idDominio: string, iuv: string, idRicevuta: string, ...sub: string[]): string {
    return ['ricevute', encodeURIComponent(idDominio), encodeURIComponent(iuv), encodeURIComponent(idRicevuta), ...sub].join('/');
  }

  /** `GET /ricevute` — lista paginata (metadata-only). */
  list(filters: RicevuteListFilters = {}): Observable<Slice<RicevutaSummary>> {
    return this.api.list<RicevutaSummary>('ricevute', filters as Record<string, ParamValue>);
  }

  /** `GET /ricevute/{idDominio}/{iuv}/{idRicevuta}` — dettaglio. */
  get(idDominio: string, iuv: string, idRicevuta: string): Observable<Ricevuta> {
    return this.api.get<Ricevuta>(this.path(idDominio, iuv, idRicevuta));
  }

  /** `GET …/rpt` — RPT come Blob nel formato richiesto (json|xml; **no pdf**). */
  getRptBlob(idDominio: string, iuv: string, idRicevuta: string, formato: Exclude<RicevutaFormato, 'pdf'>): Observable<Blob> {
    return this.api.getBlob(this.path(idDominio, iuv, idRicevuta, 'rpt'), ACCEPT_BY_FORMATO[formato]);
  }

  /** `GET …/rt` — RT come Blob nel formato richiesto (json|xml|pdf). */
  getRtBlob(idDominio: string, iuv: string, idRicevuta: string, formato: RicevutaFormato): Observable<Blob> {
    return this.api.getBlob(this.path(idDominio, iuv, idRicevuta, 'rt'), ACCEPT_BY_FORMATO[formato]);
  }
}
