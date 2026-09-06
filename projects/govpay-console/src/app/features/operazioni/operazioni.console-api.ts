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
  Esecuzione,
  EsecuzioneSummary,
  EsecuzioniListFilters,
  Operazione,
  RichiestaEsecuzione,
} from './operazione.model';

/**
 * Client API **Operazioni asincrone V2** su {@link ConsoleApiService}.
 * Catalogo operazioni (`GET /operazioni` → array), esecuzioni paginate
 * (`/operazioni/{id}/esecuzioni`), avvio manuale (POST 202), dettaglio e
 * annullo (DELETE 202) di una singola esecuzione.
 */
@Injectable({ providedIn: 'root' })
export class OperazioniConsoleApi {
  private readonly api = inject(ConsoleApiService);

  private esecuzioniPath(idOperazione: string, ...sub: string[]): string {
    return ['operazioni', encodeURIComponent(idOperazione), 'esecuzioni', ...sub].join('/');
  }

  /** `GET /operazioni` — catalogo (array, non paginato). */
  list(): Observable<Operazione[]> {
    return this.api.get<Operazione[]>('operazioni');
  }

  /** `GET /operazioni/{id}/esecuzioni` — esecuzioni paginate (offset). */
  listEsecuzioni(idOperazione: string, filters: EsecuzioniListFilters = {}): Observable<Slice<EsecuzioneSummary>> {
    return this.api.list<EsecuzioneSummary>(this.esecuzioniPath(idOperazione), filters as Record<string, ParamValue>);
  }

  /** `GET /operazioni/{id}/esecuzioni/{idEsecuzione}` — dettaglio esecuzione. */
  getEsecuzione(idOperazione: string, idEsecuzione: string): Observable<Esecuzione> {
    return this.api.get<Esecuzione>(this.esecuzioniPath(idOperazione, encodeURIComponent(idEsecuzione)));
  }

  /** `POST /operazioni/{id}/esecuzioni` — avvia manualmente (202). Ritorna l'esecuzione creata. */
  avvia(idOperazione: string, body: RichiestaEsecuzione = {}): Observable<Esecuzione> {
    return this.api.post<Esecuzione>(this.esecuzioniPath(idOperazione), body).pipe(
      map((res: HttpResponse<Esecuzione>) => res.body as Esecuzione)
    );
  }

  /** `DELETE /operazioni/{id}/esecuzioni/{idEsecuzione}` — annulla l'esecuzione (202). */
  annulla(idOperazione: string, idEsecuzione: string): Observable<void> {
    return this.api.delete(this.esecuzioniPath(idOperazione, encodeURIComponent(idEsecuzione)));
  }
}
