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
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration, withXhr } from '@angular/common/http';
import { ConfigService } from '@linkit/shared-ui';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { timeoutInterceptor } from './interceptors/timeout.interceptor';
import { environment } from '@environment';

/**
 * Provider helper del modulo core. Va aggiunto in `app.config.ts`.
 *
 * Espone:
 *   - HttpClient con interceptors (auth, error, timeout) e XSRF
 *   - AppInitializer che carica `app-config.json` prima del bootstrap
 */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(
      // Angular 22 usa fetch come backend di default: manteniamo XHR per
      // lasciare invariato il comportamento HTTP rispetto alla v21.
      withXhr(),
      // timeout per ultimo: il suo errore (status 0) passa anche da errorInterceptor.
      withInterceptors([authInterceptor, errorInterceptor, timeoutInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),
    provideAppInitializer(() => {
      const config = inject(ConfigService);
      return config.load(environment.configFile);
    }),
  ]);
}
