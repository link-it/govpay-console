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
import { PreferencesService } from './preferences.service';

/**
 * Ponte fra le preferenze server-side ({@link PreferencesService}) e i servizi
 * UI della libreria (`SystemFacade` colore, `LanguageService` lingua), **senza
 * patchare la lib mirror** (bridge a livello app, §2 del piano).
 *
 * Per ogni preferenza sincronizzata due direzioni:
 * - **server → UI**: quando la preferenza cambia (login o altro device) la
 *   applica via il setter pubblico del servizio;
 * - **UI → server**: quando l'utente cambia il valore lo persiste.
 *
 * `applied*` è l'ancora di riconciliazione: evita loop e la persistenza del
 * valore iniziale/di default al primo caricamento. Istanziato al boot da
 * `app.config.ts`.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesBridge {
  private readonly prefs = inject(PreferencesService);
  private readonly system = inject(SystemFacade);
  private readonly lang = inject(LanguageService);

  private appliedScheme?: ColorScheme;
  private appliedLocale?: string;

  constructor() {
    // ── Color scheme ──────────────────────────────────────────────────
    // server → UI
    effect(() => {
      const scheme = this.prefs.get<ColorScheme | undefined>('colorScheme', undefined);
      if (scheme && scheme !== this.appliedScheme) {
        this.appliedScheme = scheme;
        this.system.setColorScheme(scheme);
      }
    });
    // UI → server
    effect(() => {
      const current = this.system.colorScheme();
      if (!this.prefs.available()) return;
      if (this.appliedScheme === undefined) {
        // Prima sincronizzazione: adotta il valore corrente come baseline senza
        // persistere (non salviamo il default al boot).
        this.appliedScheme = current;
        return;
      }
      if (current !== this.appliedScheme) {
        this.appliedScheme = current;
        this.prefs.set('colorScheme', current);
      }
    });

    // ── Lingua ────────────────────────────────────────────────────────
    // server → UI
    effect(() => {
      const locale = this.prefs.get<string | undefined>('locale', undefined);
      if (locale && locale !== this.appliedLocale) {
        this.appliedLocale = locale;
        this.lang.setLanguage(locale);
      }
    });
    // UI → server
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
}
