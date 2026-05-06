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

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { ConfigService } from '@core/config';
import {
  mapProfileToUser,
  type AuthUser,
  type ProfiloResponse,
} from '../models/auth.model';

/**
 * Client HTTP per gli endpoint di autenticazione e profilo.
 *
 * Per i dettagli vedi `AppConfig.Auth.Endpoints`.
 * - `getProfile()` → recupera il profilo dell'utente autenticato (qualsiasi modalità).
 * - `loginBasic(...)` → invia credenziali Basic; il server risponde con la stessa rotta
 *   profilo + cookie/sessione (XSRF gestito da `withXsrfConfiguration`).
 * - `logout()` → POST al logout endpoint.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private base(): string {
    return this.config.appConfig()?.GOVAPI.GOVPAY ?? '/govpay-api-backoffice/rs/form/v1';
  }

  /**
   * Login Basic: invia `Authorization: Basic <base64>` su `/profilo`.
   * Il server, in caso di successo, risponde con la `ProfiloResponse` grezza,
   * che viene normalizzata in `AuthUser` via `mapProfileToUser`.
   */
  loginBasic(username: string, password: string): Observable<AuthUser> {
    const headers = new HttpHeaders({
      Authorization: 'Basic ' + btoa(`${username}:${password}`),
    });
    return this.http
      .get<ProfiloResponse>(`${this.base()}/profilo`, { headers })
      .pipe(map((p) => mapProfileToUser(p, username)));
  }

  getProfile(principalFallback?: string): Observable<AuthUser> {
    return this.http
      .get<ProfiloResponse>(`${this.base()}/profilo`)
      .pipe(map((p) => mapProfileToUser(p, principalFallback)));
  }

  logout(): Observable<{ logoutUrl?: string }> {
    const endpoint = this.config.appConfig()?.Auth.Endpoints.logout ?? '/oauth2/logout';
    return this.http.post<{ logoutUrl?: string }>(`${this.base()}${endpoint}`, {});
  }
}
