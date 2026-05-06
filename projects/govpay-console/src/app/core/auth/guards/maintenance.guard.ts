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
import { ConfigService } from '@core/config';

/**
 * Guard che reindirizza a `/maintenance` se `AppConfig.Maintenance.enabled` è true.
 * Va applicato alla rotta root con layout, **non** a `/maintenance` stessa né a `/auth/*`.
 */
export const maintenanceGuard: CanActivateFn = (_route, state) => {
  const config = inject(ConfigService);
  const router = inject(Router);
  if (state.url.startsWith('/maintenance')) return true;
  const enabled = config.appConfig()?.Maintenance?.enabled;
  if (enabled) {
    return router.createUrlTree(['/maintenance']);
  }
  return true;
};
