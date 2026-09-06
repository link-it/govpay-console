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
  FlussiRendicontazioneListFilters,
  FlussoRendicontazione,
  FlussoRendicontazioneSummary,
} from './rendicontazione.model';

/**
 * Client API **Flussi di rendicontazione V2** su {@link ConsoleApiService}
 * (base `/govpay-console-api`, `Slice<T>`, RFC 7807). Consultazione read-only:
 * lista paginata (`FlussoRendicontazioneSummary`), dettaglio per la quaterna
 * `(idDominio, idFlusso, idPsp, revisione)` e download XML pagoPA (stesso path
 * del dettaglio, `Accept: application/xml`).
 */
@Injectable({ providedIn: 'root' })
export class RendicontazioniConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** Compone il path `flussi-rendicontazione/{idDominio}/{idFlusso}/{idPsp}/{revisione}`. */
  private path(idDominio: string, idFlusso: string, idPsp: string, revisione: number | string): string {
    return [
      'flussi-rendicontazione',
      encodeURIComponent(idDominio),
      encodeURIComponent(idFlusso),
      encodeURIComponent(idPsp),
      encodeURIComponent(String(revisione)),
    ].join('/');
  }

  /** `GET /flussi-rendicontazione` — lista paginata (metadata-only). */
  list(filters: FlussiRendicontazioneListFilters = {}): Observable<Slice<FlussoRendicontazioneSummary>> {
    return this.api.list<FlussoRendicontazioneSummary>('flussi-rendicontazione', filters as Record<string, ParamValue>);
  }

  /** `GET …/{idDominio}/{idFlusso}/{idPsp}/{revisione}` — dettaglio metadata-only. */
  get(idDominio: string, idFlusso: string, idPsp: string, revisione: number | string): Observable<FlussoRendicontazione> {
    return this.api.get<FlussoRendicontazione>(this.path(idDominio, idFlusso, idPsp, revisione));
  }

  /** `GET …` con `Accept: application/xml` — XML originale del flusso pagoPA (Blob). */
  getXml(idDominio: string, idFlusso: string, idPsp: string, revisione: number | string): Observable<Blob> {
    return this.api.getBlob(this.path(idDominio, idFlusso, idPsp, revisione), 'application/xml');
  }
}
