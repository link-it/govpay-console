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

import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ConfigService } from '@linkit/shared-ui';
import { TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Applica `Preferences.TIMEOUT` (via `ConfigService.requestTimeout`) alle
 * chiamate HTTP.
 *
 * - Senza timeout configurato (assente o ≤ 0) la richiesta passa invariata.
 * - I download di file (`responseType: 'blob'`, es. lo zip delle stampe di un
 *   tracciato) sono esclusi: possono durare legittimamente di più.
 * - Il limite vale tra un evento e il successivo: HttpClient emette subito
 *   l'evento "inviata", quindi in pratica è l'attesa massima della risposta.
 * - Allo scadere la chiamata fallisce con un `HttpErrorResponse` con `status`
 *   0, come un backend non raggiungibile.
 */
export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const ms = inject(ConfigService).requestTimeout();
  if (ms == null || req.responseType === 'blob') return next(req);

  return next(req).pipe(
    timeout(ms),
    catchError((err: unknown) => {
      if (err instanceof TimeoutError) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 0,
              statusText: 'Timeout',
              url: req.urlWithParams,
              error: new Error(`Nessuna risposta entro ${ms} ms`),
            })
        );
      }
      return throwError(() => err);
    })
  );
};
