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
import type {
  OperazionePendenza,
  OperazionePendenzaSummary,
  Tracciato,
  TracciatiListFilters,
} from './tracciato.model';

/** Opzioni per l'upload multipart di un tracciato. */
export interface UploadTracciatoOptions {
  idDominio?: string;
  /** `JSON` | `CSV`; se assente desunto dall'estensione del file. */
  formato?: 'JSON' | 'CSV';
  /** Tipo pendenza da applicare a tutte le righe (solo CSV). */
  idTipoPendenza?: string;
  /** Se generare le stampe PDF degli avvisi (default lato BE: true). */
  stampaAvvisi?: boolean;
}

/**
 * Client API **Tracciati pendenze V2** su {@link ConsoleApiService} (base
 * `/govpay-console-api`, `Slice<T>`, RFC 7807). Lista/dettaglio metadata,
 * upload multipart, sub-resource `richiesta`/`esito` (blob json/csv),
 * `stampe` (zip) e `operazioni` (lista cursor + dettaglio riga).
 */
@Injectable({ providedIn: 'root' })
export class TracciatiConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private path(id: number | string, ...sub: string[]): string {
    return ['pendenze/tracciati', encodeURIComponent(String(id)), ...sub].join('/');
  }

  /** `GET /pendenze/tracciati` — lista paginata (metadata). */
  list(filters: TracciatiListFilters = {}): Observable<Slice<Tracciato>> {
    return this.api.list<Tracciato>('pendenze/tracciati', filters as Record<string, ParamValue>);
  }

  /** `GET /pendenze/tracciati/{id}` — dettaglio metadata (con `_links`). */
  get(id: number | string): Observable<Tracciato> {
    return this.api.get<Tracciato>(this.path(id));
  }

  /**
   * `POST /pendenze/tracciati` — upload multipart del file tracciato (JSON/CSV).
   * Ritorna l'`id` del tracciato creato (dall'header `Location` o dal body).
   */
  upload(file: File, opts: UploadTracciatoOptions = {}): Observable<Tracciato> {
    const form = new FormData();
    form.append('file', file, file.name);
    const params: Record<string, ParamValue> = {
      idDominio: opts.idDominio,
      formato: opts.formato,
      idTipoPendenza: opts.idTipoPendenza,
      stampaAvvisi: opts.stampaAvvisi,
    };
    return this.api.postMultipart<Tracciato>('pendenze/tracciati', form, params).pipe(
      map((res: HttpResponse<Tracciato>) => res.body as Tracciato)
    );
  }

  /** `GET …/richiesta` — payload originale del tracciato (json|csv) come Blob. */
  getRichiestaBlob(id: number | string, formato: 'JSON' | 'CSV'): Observable<Blob> {
    return this.api.getBlob(this.path(id, 'richiesta'), formato === 'CSV' ? 'text/csv' : 'application/json');
  }

  /** `GET …/esito` — esito riga-per-riga (json|csv) come Blob. */
  getEsitoBlob(id: number | string, formato: 'JSON' | 'CSV'): Observable<Blob> {
    return this.api.getBlob(this.path(id, 'esito'), formato === 'CSV' ? 'text/csv' : 'application/json');
  }

  /** `GET …/stampe` — ZIP degli avvisi PDF. */
  getStampeBlob(id: number | string): Observable<Blob> {
    return this.api.getBlob(this.path(id, 'stampe'), 'application/zip');
  }

  /** `GET …/operazioni` — lista operazioni (cursor). */
  listOperazioni(id: number | string, filters: { limit?: number; cursor?: string } = {}): Observable<Slice<OperazionePendenzaSummary>> {
    return this.api.list<OperazionePendenzaSummary>(this.path(id, 'operazioni'), filters as Record<string, ParamValue>);
  }

  /** `GET …/operazioni/{numero}` — dettaglio della singola operazione (con anagrafica). */
  getOperazione(id: number | string, numero: number | string): Observable<OperazionePendenza> {
    return this.api.get<OperazionePendenza>(this.path(id, 'operazioni', encodeURIComponent(String(numero))));
  }
}
