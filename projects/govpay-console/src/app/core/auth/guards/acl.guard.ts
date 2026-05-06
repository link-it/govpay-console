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

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '@core/ui/snackbar/snackbar.service';
import type { AuthAcl } from '../models/auth.model';

/**
 * Crea un guard che richiede uno o più permessi `AuthAcl`.
 * Se l'utente non è autenticato, redirige a `/auth/login` con `returnUrl`.
 * Se è autenticato ma non possiede nessuno dei permessi indicati, redirige a `/dashboard`.
 *
 * Esempio:
 *   ```ts
 *   { path: 'pagamenti', canActivate: [aclGuard('hasPagamenti')], ... }
 *   ```
 */
export function aclGuard(...required: (keyof AuthAcl)[]): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const snackbar = inject(SnackbarService);

    const ok = await auth.ensureSession();
    if (!ok) {
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }
    if (required.length === 0) return true;

    const acl = auth.user()?.acl ?? {};
    const allowed = required.some((flag) => acl[flag] === true);
    if (!allowed) {
      snackbar.error('Non hai i permessi per accedere a questa sezione.');
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  };
}
