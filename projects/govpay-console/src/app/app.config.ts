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
import { BREADCRUMB_ICON_RESOLVER, ConfigService, LNK_TABS_DEFAULTS, LanguageService } from '@linkit/shared-ui';
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
import { AuthService } from '@core/auth/services/auth.service';
import { PreferencesBridge } from '@core/preferences';
import { APP_ICONS } from '@core/layout/icons.config';
import { iconForNavLabel } from '@core/layout/nav';

registerLocaleData(localeIt);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideCore(),
    { provide: BREADCRUMB_ICON_RESOLVER, useValue: iconForNavLabel },
    // Default globale dei tab da `app-config.json` (Layout.tabsVariant): allinea
    // tutte le istanze di <lnk-tabs>. Override per-istanza (input `variant`) e a
    // runtime (pannello Tweaks) sempre possibili. La factory è valutata lazy al
    // primo utilizzo, quando la config è già stata caricata dall'app initializer.
    {
      provide: LNK_TABS_DEFAULTS,
      useFactory: (config: ConfigService) => ({ variant: config.appConfig()?.Layout.tabsVariant }),
      deps: [ConfigService],
    },
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
      // Ponte preferenze server ↔ UI (color scheme, lingua): i suoi effect
      // applicano le preferenze dell'operatore e ne persistono i cambi.
      inject(PreferencesBridge);
      // Ri-idrata la sessione al boot (GET /profilo): allinea lo stato auth del
      // FE alla sessione cookie su qualsiasi route di atterraggio (es. dashboard,
      // che altrimenti mostrerebbe "Accedi" pur avendo una sessione valida).
      // Fire-and-forget e deduplicato con `ensureSession()` dei guard.
      void inject(AuthService).ensureSession();
    }),
  ],
};
