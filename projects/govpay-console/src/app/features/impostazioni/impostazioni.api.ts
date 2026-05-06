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

/**
 * Configurazione generale del sistema (`GET /configurazioni`).
 * Lo schema OpenAPI è molto ampio e gerarchico: lo trattiamo come oggetto
 * opaco e lo visualizziamo come JSON nel detail; le modifiche puntuali
 * vanno in PATCH (per ora non esposte dalla UI).
 */
export type Configurazione = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class ImpostazioniApi {
  private readonly api = inject(ApiService);

  get(): Observable<Configurazione> {
    return this.api.raw<Configurazione>('GET', 'configurazioni');
  }
}
