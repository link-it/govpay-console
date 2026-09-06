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
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/services/auth.service';

/**
 * Endpoint del piano autenticazione (profilo/login/logout): un loro 401 è
 * gestito dai chiamanti (guard/ensureSession/revalidate/logout) e **non** deve
 * innescare la ri-validazione dell'interceptor (eviterebbe un loop, dato che la
 * ri-validazione stessa chiama `/profilo`).
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/profilo') || url.includes('logout');
}

/**
 * Interceptor errori globale.
 *
 * Su 401 di una richiesta di **feature** non slogga subito: la sessione
 * potrebbe essere ancora valida (es. token XSRF fuori sync o endpoint
 * specifico). Ri-valida via `AuthService.revalidate()` (GET `/profilo`, stessa
 * sessione delle feature) e redirige a `/auth/login` **solo** se anche quello
 * fallisce. Così si evita il falso pulsante "Accedi" con sessione viva.
 * (Nessun refresh-token lato BE: si ri-valida, non si rinnova.)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthEndpoint(req.url)) {
        void auth.revalidate().then((valid) => {
          if (!valid) {
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url },
            });
          }
        });
      }
      return throwError(() => err);
    })
  );
};
