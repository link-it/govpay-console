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

import { Injectable, effect, inject } from '@angular/core';
import { LanguageService, SystemFacade, type ColorScheme } from '@linkit/shared-ui';
import { AuthService } from '@core/auth/services/auth.service';
import { PreferencesService } from './preferences.service';

/**
 * Ponte fra le preferenze server-side ({@link PreferencesService}) e i servizi
 * UI della libreria (`SystemFacade` colore, `LanguageService` lingua), **senza
 * patchare la lib mirror** (bridge a livello app, §2 del piano).
 *
 * - **Ripristino al login**: quando compare un utente autenticato (login o
 *   rehydrate di sessione) le sue preferenze salvate vengono applicate una
 *   volta. Al logout le ancore si azzerano, così un successivo login riapplica.
 * - **Persistenza**: i cambi UI dell'operatore vengono salvati; il confronto con
 *   l'ancora `applied*` evita loop e la persistenza del valore iniziale al boot.
 *
 * Istanziato al boot da `app.config.ts`.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesBridge {
  private readonly prefs = inject(PreferencesService);
  private readonly auth = inject(AuthService);
  private readonly system = inject(SystemFacade);
  private readonly lang = inject(LanguageService);

  private lastUserId?: string;
  private appliedScheme?: ColorScheme;
  private appliedLocale?: string;

  constructor() {
    // Ripristino al login / azzeramento al logout.
    effect(() => {
      const id = this.auth.user()?.id;
      if (id) {
        if (id !== this.lastUserId) {
          this.lastUserId = id;
          this.applySaved();
        }
      } else if (this.lastUserId !== undefined) {
        this.lastUserId = undefined;
        this.appliedScheme = undefined;
        this.appliedLocale = undefined;
      }
    });

    // Persistenza dei cambi UI (solo operatori con `preferenze`).
    effect(() => {
      const current = this.system.colorScheme();
      if (!this.prefs.available()) return;
      if (this.appliedScheme === undefined) {
        // Baseline: adotta il valore corrente senza persistere il default.
        this.appliedScheme = current;
        return;
      }
      if (current !== this.appliedScheme) {
        this.appliedScheme = current;
        this.prefs.set('colorScheme', current);
      }
    });
    effect(() => {
      const current = this.lang.current();
      if (!this.prefs.available()) return;
      if (this.appliedLocale === undefined) {
        this.appliedLocale = current;
        return;
      }
      if (current !== this.appliedLocale) {
        this.appliedLocale = current;
        this.prefs.set('locale', current);
      }
    });
  }

  /** Applica le preferenze salvate (se presenti) ai servizi UI della libreria. */
  private applySaved(): void {
    const scheme = this.prefs.get<ColorScheme | undefined>('colorScheme', undefined);
    if (scheme) {
      this.appliedScheme = scheme;
      this.system.setColorScheme(scheme);
    }
    const locale = this.prefs.get<string | undefined>('locale', undefined);
    if (locale) {
      this.appliedLocale = locale;
      this.lang.setLanguage(locale);
    }
  }
}
