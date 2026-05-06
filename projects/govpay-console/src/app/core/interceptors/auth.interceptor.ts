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

import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

/**
 * Aggiunge l'header `Authorization` per Basic e OAuth2 (vedi `AuthService.authorizationHeader()`).
 * SPID/IAM si appoggiano a cookie di sessione gestiti dal server, quindi non aggiungono header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const header = auth.authorizationHeader();
  if (header && !req.headers.has('Authorization')) {
    req = req.clone({ setHeaders: { Authorization: header } });
  }
  return next(req);
};
