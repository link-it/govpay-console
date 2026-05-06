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
import { ApiService } from '@core/services/api.service';
import type { Pageable } from '@core/models';
import type { Pagamento, PagamentiListFilters } from './pagamento.model';

@Injectable({ providedIn: 'root' })
export class PagamentiApi {
  private readonly api = inject(ApiService);

  list(filters: PagamentiListFilters = {}): Observable<Pageable<Pagamento>> {
    return this.api.list<Pagamento>('pagamenti', filters as Record<string, string | number | boolean | undefined>);
  }

  get(id: string): Observable<Pagamento> {
    return this.api.get<Pagamento>('pagamenti', id);
  }
}
