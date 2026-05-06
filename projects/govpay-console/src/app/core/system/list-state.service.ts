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

import { Injectable } from '@angular/core';

/**
 * Stato in-memory delle pagine lista (filtri + ordinamento).
 * Permette di ripristinarlo quando l'utente torna indietro da un
 * dettaglio (Angular ricostruisce il componente lista, ma il servizio
 * `providedIn: 'root'` mantiene lo state per la sessione).
 *
 * Esempio:
 *   ```ts
 *   private state = inject(ListStateService);
 *
 *   ngOnInit() {
 *     const saved = this.state.get<MyState>('pendenze');
 *     if (saved) {
 *       this.filters.set(saved.filters);
 *       this.sort.set(saved.sort);
 *     }
 *   }
 *
 *   private syncState = effect(() => {
 *     this.state.set('pendenze', { filters: this.filters(), sort: this.sort() });
 *   });
 *   ```
 *
 * Note:
 *   - In-memory: si svuota al refresh della pagina (per design, una
 *     versione più persistente userebbe sessionStorage; non richiesto).
 *   - Niente chiave per tenant: lo state è scoped per sessione browser.
 */
@Injectable({ providedIn: 'root' })
export class ListStateService {
  private readonly store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  clear(key?: string): void {
    if (key) this.store.delete(key);
    else this.store.clear();
  }
}
