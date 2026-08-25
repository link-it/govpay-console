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
  EnteCreditore,
  EnteCreditoreSummary,
  EntiCreditoriListFilters,
  IbanPagoPa,
} from './pagopa.model';

/**
 * Client API **Consultazione pagoPA V2** su {@link ConsoleApiService}.
 * Read-only, pensato come lookup per il censimento assistito: enti creditori
 * (`/pagopa/enti-creditori` typeahead + `/{taxCode}` anagrafica) e IBAN
 * abilitati per dominio (`/pagopa/iban?idDominio=…`).
 */
@Injectable({ providedIn: 'root' })
export class PagopaConsoleApi {
  private readonly api = inject(ConsoleApiService);

  /** `GET /pagopa/enti-creditori` — typeahead enti creditori (paginato). */
  listEntiCreditori(filters: EntiCreditoriListFilters = {}): Observable<Slice<EnteCreditoreSummary>> {
    return this.api.list<EnteCreditoreSummary>('pagopa/enti-creditori', filters as Record<string, ParamValue>);
  }

  /** `GET /pagopa/enti-creditori/{taxCode}` — anagrafica per precompilare il form Dominio. */
  getEnteCreditore(taxCode: string): Observable<EnteCreditore> {
    return this.api.get<EnteCreditore>(`pagopa/enti-creditori/${encodeURIComponent(taxCode)}`);
  }

  /** `GET /pagopa/iban?idDominio=…` — IBAN abilitati su pagoPA per il dominio. */
  listIban(idDominio: string): Observable<IbanPagoPa[]> {
    return this.api.get<IbanPagoPa[]>('pagopa/iban', { idDominio });
  }
}
