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

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../config/config.service';
import type { Language } from '../config/app-config.model';

const LOCALE_STORAGE_KEY = 'lnk-locale';

const DEFAULT_LANGUAGES: Language[] = [
  { code: 'it', label: 'Italiano', short: 'IT', flag: '🇮🇹' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
];

/**
 * Servizio i18n signal-based.
 *
 * - Espone `languages` (da `LayoutConfig.languages` o default it/en).
 * - `current` è la lingua attualmente selezionata.
 * - `setLanguage(code)` aggiorna `TranslateService`, persiste su `localStorage`,
 *   imposta `<html lang="...">`.
 * - Al primo ngOnInit (post-config), risolve la lingua iniziale: localStorage > config.default > navigator > `'it'`.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly config = inject(ConfigService);
  private readonly document = inject(DOCUMENT);

  private readonly _current = signal<string>('it');
  readonly current = this._current.asReadonly();

  readonly languages = computed<Language[]>(() => {
    const fromConfig = this.config.appConfig()?.Layout.languages;
    return fromConfig?.length ? fromConfig : DEFAULT_LANGUAGES;
  });

  readonly currentLanguage = computed<Language>(() => {
    const list = this.languages();
    return list.find((l) => l.code === this._current()) ?? list[0];
  });

  constructor() {
    // Quando la config arriva (effect), risolve la lingua iniziale e la applica.
    effect(() => {
      const langs = this.languages();
      if (!langs.length) return;
      const codes = langs.map((l) => l.code);
      const initial = this.resolveInitialLanguage(codes);
      if (initial !== this._current()) {
        this.applyLanguage(initial, false);
      }
    });
  }

  setLanguage(code: string): void {
    this.applyLanguage(code, true);
  }

  private applyLanguage(code: string, persist: boolean): void {
    this._current.set(code);
    this.translate.use(code);
    this.document.documentElement.lang = code;
    if (persist) {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
    }
  }

  private resolveInitialLanguage(allowed: string[]): string {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && allowed.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    const fromConfig = this.config.appConfig()?.Layout.defaultLanguage;
    if (fromConfig && allowed.includes(fromConfig)) return fromConfig;
    const browser = (navigator.language || 'it').slice(0, 2).toLowerCase();
    if (allowed.includes(browser)) return browser;
    return allowed[0];
  }
}
