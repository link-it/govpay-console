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

import { Injectable, computed, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ConsoleApiService } from '@core/services';
import { AuthService } from '@core/auth/services/auth.service';
import type { ProfiloResponse } from '@core/auth/models/auth.model';
import type { JsonPatchOp } from '@core/models';
import type { AppPreferences } from './app-preferences.model';

/**
 * Preferenze UI dell'operatore, persistite server-side in `Profilo.preferenze`
 * via **`PATCH /profilo`** (JSON Patch, solo path `/preferenze`, last-write-wins).
 *
 * Sorgente di verità: l'`AuthUser` caricato da `GET /profilo`. Le scritture sono
 * ottimistiche (aggiornano subito lo stato locale) poi riconciliate col
 * `Profilo` ritornato. Per le utenze **non-operatore** (`preferenze` assente)
 * `set()` è un no-op: valgono solo le preferenze locali (localStorage gestito da
 * `SystemFacade`/`LanguageService`).
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ConsoleApiService);

  /** Preferenze correnti (reattive sull'utente); `{}` se assenti. */
  readonly preferenze = computed<AppPreferences>(
    () => (this.auth.user()?.preferenze ?? {}) as AppPreferences,
  );

  /** `true` se l'utenza espone `preferenze` (operatore): abilita la persistenza. */
  readonly available = computed(() => this.auth.user()?.preferenze != null);

  /** Legge una preferenza top-level con fallback. */
  get<T>(key: string, fallback: T): T {
    const v = this.preferenze()[key];
    return v === undefined ? (fallback as T) : (v as T);
  }

  /**
   * Scrive una preferenza top-level e la persiste. Il backend consente il
   * PATCH **solo sul path `/preferenze`** (l'intero oggetto), non sui sotto-path:
   * inviamo quindi `replace /preferenze` con l'oggetto completo (merge locale +
   * la modifica). Aggiorna subito lo stato locale, poi riconcilia col `Profilo`
   * ritornato. No-op per le utenze non-operatore.
   */
  set<T>(key: string, value: T): void {
    if (!this.available()) return;
    const next: AppPreferences = { ...this.preferenze(), [key]: value };
    // Aggiornamento ottimistico.
    this.auth.setPreferenze(next);
    const ops: JsonPatchOp[] = [{ op: 'replace', path: '/preferenze', value: next }];
    this.api
      .patch<ProfiloResponse>('profilo', ops)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.body?.preferenze) this.auth.setPreferenze(res.body.preferenze);
      });
  }
}
