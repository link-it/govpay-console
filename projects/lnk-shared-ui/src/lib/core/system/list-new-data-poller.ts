/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Signal, signal } from '@angular/core';
import { Observable, Subscription, interval, switchMap } from 'rxjs';

/**
 * Handle ritornato da `createNewDataPoller()`. Espone il `count`
 * read-only come signal e i metodi `start/stop/reset` per il
 * lifecycle.
 */
export interface NewDataPoller {
  /** Signal read-only con il delta corrente (nuovi elementi). */
  readonly count: Signal<number>;
  /** Avvia il polling. Idempotente (call multipli ignorati). */
  start(): void;
  /** Stop polling. Idempotente. */
  stop(): void;
  /**
   * Azzera `count`. Se `newBaseline` e` valorizzato aggiorna anche la
   * baseline di riferimento; altrimenti la baseline corrente resta
   * (il prossimo `fetch()` ricalcolera` il delta su quella).
   */
  reset(newBaseline?: number): void;
}

/** Opzioni di configurazione del poller. */
export interface PollerOptions {
  /**
   * Funzione che ritorna il `total` corrente. Il poller la invoca
   * ad ogni intervallo e confronta il risultato con la baseline.
   */
  fetch: () => Observable<number>;
  /** Intervallo in millisecondi. Default `30_000` (30s). */
  intervalMs?: number;
  /**
   * Total di riferimento iniziale. Se omesso, il primo `fetch()` lo
   * stabilisce silenziosamente (`count` resta a 0 fino al secondo
   * fetch — evita di mostrare "ci sono N nuovi" gia` al boot).
   */
  initialTotal?: number;
}

/**
 * Crea un poller signal-based che confronta il `total` ritornato dal
 * `fetch()` ad ogni intervallo con la baseline corrente, aggiornando
 * il signal `count` con il delta dei nuovi elementi rilevati.
 *
 * Pair tipico con `<lnk-list-refresh-banner>`:
 *
 *   ```ts
 *   private readonly poller = createNewDataPoller({
 *     fetch: () => this.api.countPendenze(this.filters()),
 *     intervalMs: 30_000,
 *   });
 *   readonly newItemsCount = this.poller.count;
 *
 *   constructor() {
 *     this.poller.start();
 *     inject(DestroyRef).onDestroy(() => this.poller.stop());
 *   }
 *
 *   onRefresh(): void {
 *     this.refresh();         // ricarica i dati
 *     this.poller.reset();    // azzera count, ribaselina al prossimo fetch
 *   }
 *   ```
 *
 *   ```html
 *   <lnk-list-refresh-banner [count]="newItemsCount()" (refresh)="onRefresh()" />
 *   ```
 *
 * Note implementative:
 *  - Il poller e` agnostico sul backend: `fetch()` puo` essere un
 *    endpoint dedicato `?countOnly=true` oppure una chiamata normale
 *    paginata che ritorna `total`. Per GovPay, conviene un
 *    `?pagina=1&risultatiPerPagina=1` per minimizzare il payload.
 *  - `switchMap` cancella le request in volo se l'intervallo arriva
 *    prima della risposta — evita race condition su rete lenta.
 *  - `interval()` di RxJS lavora con la zona Angular; con zone.js
 *    il signal `count` viene cambiato in zona e i computed/effect
 *    consumer si aggiornano correttamente.
 *  - Il poller NON e` `@Injectable`: e` una factory function pura.
 *    Ogni feature ne crea uno con la sua `fetch()`.
 */
export function createNewDataPoller(options: PollerOptions): NewDataPoller {
  const intervalMs = options.intervalMs ?? 30_000;
  const _count = signal(0);
  let baseline: number | null = options.initialTotal ?? null;
  let sub: Subscription | null = null;

  function start(): void {
    if (sub) return;
    sub = interval(intervalMs)
      .pipe(switchMap(() => options.fetch()))
      .subscribe({
        next: (total) => {
          if (baseline === null) {
            baseline = total;
            return;
          }
          const delta = total - baseline;
          if (delta > 0) _count.set(delta);
        },
      });
  }

  function stop(): void {
    sub?.unsubscribe();
    sub = null;
  }

  function reset(newBaseline?: number): void {
    if (newBaseline !== undefined) baseline = newBaseline;
    _count.set(0);
  }

  return {
    count: _count.asReadonly(),
    start,
    stop,
    reset,
  };
}
