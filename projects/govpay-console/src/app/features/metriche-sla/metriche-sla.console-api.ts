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
import type { SlaKpiCodice, SlaResponse, SlaSerieStoricaResponse } from './sla.model';

/** Filtri periodo comuni alle metriche SLA (date `YYYY-MM-DD`). */
export interface SlaPeriodoFiltri {
  dataDa?: string;
  dataA?: string;
}

/** Filtri della serie storica: periodo + granularità del bucket (minuti). */
export interface SlaSerieFiltri extends SlaPeriodoFiltri {
  granularitaMinuti?: number;
}

/**
 * Client API **Metriche SLA V2** su {@link ConsoleApiService} (base
 * `/govpay-console-api`, RFC 7807). KPI aggregati (gauge) e serie storica per
 * metodo (grafico temporale). Read-only.
 */
@Injectable({ providedIn: 'root' })
export class MetricheSlaConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** `GET /metriche/sla` — KPI di conformità aggregati sul periodo. */
  getSla(filtri: SlaPeriodoFiltri = {}): Observable<SlaResponse> {
    return this.api.get<SlaResponse>('metriche/sla', filtri as Record<string, ParamValue>);
  }

  /** `GET /metriche/sla/{codice}` — serie storica di conformità per un metodo PA. */
  getSerieStorica(codice: SlaKpiCodice, filtri: SlaSerieFiltri = {}): Observable<SlaSerieStoricaResponse> {
    return this.api.get<SlaSerieStoricaResponse>(
      `metriche/sla/${encodeURIComponent(codice)}`,
      filtri as Record<string, ParamValue>,
    );
  }
}
