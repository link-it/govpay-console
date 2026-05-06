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
import { HttpClient } from '@angular/common/http';
import { type Observable, shareReplay } from 'rxjs';
import type { DisplayConfig } from './display-config.types';

/**
 * Carica i `DisplayConfig` (lista driven-by-config di `<lnk-item-list>`) da
 * file JSON pubblici in `assets/config/`.
 *
 *   - Cache in-memory per URL: il primo `load(url)` fa la HTTP, le call
 *     successive ottengono lo stesso stream via `shareReplay(1)`.
 *   - Cache-busting via query param `?v=<timestamp>` nel primo fetch
 *     (evita config stale dopo un deploy).
 *
 * Esempio:
 * ```ts
 * readonly rowConfig = toSignal(
 *   this.loader.load('assets/config/pendenze-config.json'),
 *   { initialValue: null },
 * );
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DisplayConfigLoader {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<DisplayConfig>>();

  load(url: string): Observable<DisplayConfig> {
    let stream = this.cache.get(url);
    if (!stream) {
      stream = this.http
        .get<DisplayConfig>(url, { params: { v: String(Date.now()) } })
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.cache.set(url, stream);
    }
    return stream;
  }

  /** Forza il refetch (svuota la cache per quell'URL). */
  invalidate(url: string): void {
    this.cache.delete(url);
  }
}
