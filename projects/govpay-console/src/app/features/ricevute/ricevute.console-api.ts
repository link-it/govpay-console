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
import { HttpResponse } from '@angular/common/http';
import { ConsoleApiService, type ParamValue } from '@core/services';
import type { Slice } from '@core/models';
import {
  normalizeRpt,
  normalizeRt,
  type Ricevuta,
  type RicevutaFormato,
  type RicevutaSummary,
  type RicevuteListFilters,
  type RecuperoRicevutaRequest,
  type RecuperoRicevutaEsito,
} from './ricevuta.model';

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

  /**
   * `GET /ricevute/{idDominio}/{iuv}/{idRicevuta}` — dettaglio. Normalizza qui
   * `rt`/`rpt` (schema flat nuovo o verboso vecchio) in `rtView`/`rptView`, così
   * il resto dell'app vede una sola forma (anti-corruption layer).
   */
  get(idDominio: string, iuv: string, idRicevuta: string): Observable<Ricevuta> {
    return this.api.get<Ricevuta>(this.path(idDominio, iuv, idRicevuta)).pipe(
      map((r) => ({ ...r, rtView: normalizeRt(r.rt, r.rpt, r.codPsp), rptView: normalizeRpt(r.rpt) }))
    );
  }

  /** `GET …/rpt` — RPT come Blob nel formato richiesto (json|xml; **no pdf**). */
  getRptBlob(idDominio: string, iuv: string, idRicevuta: string, formato: Exclude<RicevutaFormato, 'pdf'>): Observable<Blob> {
    return this.api.getBlob(this.path(idDominio, iuv, idRicevuta, 'rpt'), ACCEPT_BY_FORMATO[formato]);
  }

  /** `GET …/rt` — RT come Blob nel formato richiesto (json|xml|pdf). */
  getRtBlob(idDominio: string, iuv: string, idRicevuta: string, formato: RicevutaFormato): Observable<Blob> {
    return this.api.getBlob(this.path(idDominio, iuv, idRicevuta, 'rt'), ACCEPT_BY_FORMATO[formato]);
  }

  /**
   * `POST /ricevute` — carica una RT (XML o JSON pagoPA) come `multipart/form-data`
   * (campo `file`). Il formato è riconosciuto dal contenuto, non dall'estensione.
   * Risposta `201` con il dettaglio `Ricevuta` acquisito (tupla per il drilldown).
   */
  upload(file: File): Observable<Ricevuta> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.api
      .postMultipart<Ricevuta>('ricevute', form)
      .pipe(map((res: HttpResponse<Ricevuta>) => res.body as Ricevuta));
  }

  /**
   * `POST /ricevute/recuperi` — recupero puntuale di una RT mancante. Risposta
   * `201` (recupero sincrono → `ricevuta` valorizzata) oppure `202` (accodato
   * lato batch → `accodato: true`, `ricevuta` null).
   */
  recupera(req: RecuperoRicevutaRequest): Observable<RecuperoRicevutaEsito> {
    return this.api.post<Ricevuta>('ricevute/recuperi', req).pipe(
      map((res: HttpResponse<Ricevuta>) => ({
        accodato: res.status === 202,
        ricevuta: res.status === 201 ? (res.body ?? null) : null,
      }))
    );
  }
}
