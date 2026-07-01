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

import { DOCUMENT, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '../config/config.service';
import { LanguageService } from './language.service';
import type { Language } from '../config/app-config.model';

class FakeTranslateService {
  use = vi.fn();
}

class FakeConfigService {
  readonly appConfig = signal<Record<string, unknown> | null>(null);
  readonly effectiveLayout = signal<Record<string, unknown> | null>(null);
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: TranslateService, useClass: FakeTranslateService },
      { provide: ConfigService, useClass: FakeConfigService },
      { provide: DOCUMENT, useValue: document },
    ],
  });
}

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    setup();
  });

  it("languages default: it + en (quando config.appConfig è null)", () => {
    const svc = TestBed.inject(LanguageService);
    const codes = svc.languages().map((l) => l.code);
    expect(codes).toEqual(['it', 'en']);
  });

  it("languages: usa la lista di config.Layout.languages se presente", () => {
    const config = TestBed.inject(ConfigService) as unknown as FakeConfigService;
    const customLangs: Language[] = [
      { code: 'fr', label: 'Français' },
      { code: 'de', label: 'Deutsch' },
    ];
    config.appConfig.set({ Layout: { languages: customLangs } });
    const svc = TestBed.inject(LanguageService);
    const codes = svc.languages().map((l) => l.code);
    expect(codes).toEqual(['fr', 'de']);
  });

  it("currentLanguage ritorna l'oggetto Language per il codice corrente", () => {
    const svc = TestBed.inject(LanguageService);
    expect(svc.currentLanguage().code).toBe('it');
    expect(svc.currentLanguage().short).toBe('IT');
  });

  it("setLanguage(code): aggiorna current, chiama translate.use, imposta <html lang>", () => {
    const svc = TestBed.inject(LanguageService);
    const translate = TestBed.inject(TranslateService) as unknown as FakeTranslateService;

    svc.setLanguage('en');

    expect(svc.current()).toBe('en');
    expect(translate.use).toHaveBeenCalledWith('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it("setLanguage(code): persiste su localStorage", () => {
    const svc = TestBed.inject(LanguageService);
    svc.setLanguage('en');
    expect(localStorage.getItem('lnk-locale')).toBe('en');
  });

  it("effect iniziale: rispetta localStorage se contiene una lingua valida", () => {
    localStorage.setItem('lnk-locale', 'en');
    const svc = TestBed.inject(LanguageService);
    TestBed.tick();
    expect(svc.current()).toBe('en');
  });

  it("effect iniziale: rispetta Layout.defaultLanguage se localStorage vuoto", () => {
    const config = TestBed.inject(ConfigService) as unknown as FakeConfigService;
    config.appConfig.set({
      Layout: {
        languages: [
          { code: 'it' },
          { code: 'en' },
        ] as Language[],
        defaultLanguage: 'en',
      },
    });
    const svc = TestBed.inject(LanguageService);
    TestBed.tick();
    expect(svc.current()).toBe('en');
  });

  it("currentLanguage: fallback al primo se il code non matcha la lista", () => {
    const config = TestBed.inject(ConfigService) as unknown as FakeConfigService;
    config.appConfig.set({
      Layout: {
        languages: [{ code: 'fr', label: 'Français' }] as Language[],
      },
    });
    const svc = TestBed.inject(LanguageService);
    TestBed.tick();
    // L'effect inizializza a 'fr' (unica lingua disponibile)
    expect(svc.currentLanguage().code).toBe('fr');
  });
});
