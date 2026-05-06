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

import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { LanguageService } from '@core/i18n';
import { registerLocaleData } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideIcons } from '@ng-icons/core';
import localeIt from '@angular/common/locales/it';
import localeEn from '@angular/common/locales/en';
import { routes } from './app.routes';
import { provideCore } from '@core/core.provider';
import { APP_ICONS } from '@core/layout/icons.config';

registerLocaleData(localeIt);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideCore(),
    { provide: LOCALE_ID, useValue: 'it' },
    { provide: MAT_DATE_LOCALE, useValue: 'it' },
    provideNativeDateAdapter(),
    provideIcons(APP_ICONS),
    provideTranslateService({
      fallbackLang: 'it',
      loader: {
        provide: TranslateLoader,
        useFactory: () => {
          const http = inject(HttpClient);
          return {
            getTranslation: (lang: string) => http.get(`./assets/i18n/${lang}.json`),
          };
        },
      },
    }),
    // Istanzia LanguageService al boot così il suo effect parte e applica la
    // lingua iniziale anche se nessun componente referenzia il selettore.
    provideAppInitializer(() => {
      inject(LanguageService);
    }),
  ],
};
