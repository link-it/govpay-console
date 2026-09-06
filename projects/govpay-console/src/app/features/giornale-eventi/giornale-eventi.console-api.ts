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
  Evento,
  EventoListFilters,
  EventoRichiesta,
  EventoRisposta,
  EventoSummary,
} from './evento.model';

/**
 * Client API **Giornale Eventi V2** su {@link ConsoleApiService} (base
 * `/govpay-console-api`, `Slice<T>`, RFC 7807). Consultazione read-only:
 * lista paginata a **cursor** (`EventoSummary`), dettaglio per id (`Evento`)
 * e sub-resource `richiesta`/`risposta` (payload + header, JSON).
 */
@Injectable({ providedIn: 'root' })
export class GiornaleEventiConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** `GET /eventi` — lista paginata (metadata-only, cursor mode). */
  list(filters: EventoListFilters = {}): Observable<Slice<EventoSummary>> {
    return this.api.list<EventoSummary>('eventi', filters as Record<string, ParamValue>);
  }

  /** `GET /eventi/{id}` — dettaglio metadata-only (con `_links`). */
  get(id: string | number): Observable<Evento> {
    return this.api.get<Evento>(`eventi/${encodeURIComponent(String(id))}`);
  }

  /**
   * `GET /eventi/{id}/richiesta` — header + payload della richiesta.
   * `unmask=true` mostra in chiaro gli header sensibili (audit dedicato).
   */
  getRichiesta(id: string | number, unmask = false): Observable<EventoRichiesta> {
    return this.api.get<EventoRichiesta>(
      `eventi/${encodeURIComponent(String(id))}/richiesta`,
      unmask ? { unmask: true } : {},
    );
  }

  /** `GET /eventi/{id}/risposta` — header + payload della risposta. */
  getRisposta(id: string | number, unmask = false): Observable<EventoRisposta> {
    return this.api.get<EventoRisposta>(
      `eventi/${encodeURIComponent(String(id))}/risposta`,
      unmask ? { unmask: true } : {},
    );
  }
}
