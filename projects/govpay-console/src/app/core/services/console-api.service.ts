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
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { type Observable } from 'rxjs';
import { ConfigService } from '@linkit/shared-ui';
import type { Slice } from '@core/models';

/** Valore ammissibile per un query param serializzabile. */
export type ParamValue = string | number | boolean | undefined | null;

/** Base di default della console-api se `GOVAPI.CONSOLE` non è in config. */
const DEFAULT_CONSOLE_BASE = '/govpay-console-api';

/**
 * Forma minima di `AppConfig.GOVAPI` a cui accediamo. La chiave `CONSOLE`
 * non è (ancora) tipizzata in `@linkit/shared-ui` (`GovApiConfig`), che è una
 * copia mirror non patchabile in locale: quando verrà aggiunta upstream come
 * `CONSOLE?: string` questo cast potrà essere rimosso.
 *
 * @see NOTE-CLAUDE/REFACTORING-NUOVE-API-PENDENZE/ANALISI-E-PIANO-LAVORO.md §8.1
 */
interface GovApiConfigWithConsole {
  CONSOLE?: string;
}

/**
 * Client HTTP tipizzato per la **GovPay Console API V2** (`/govpay-console-api`).
 *
 * Differenze rispetto a `ApiService` (V1):
 * - **base URL** da `AppConfig.GOVAPI.CONSOLE` (non `GOVPAY`);
 * - **paginazione** V2: `list()` ritorna `Slice<T>` (`results` + `pagination`/
 *   `nextCursor`), non il `Pageable<T>` V1;
 * - **path espliciti** (HAL/`_links`), niente mappa `URL_BY_TIPO`;
 * - **errori** RFC 7807 `application/problem+json` (vedi `problemDetail()`).
 *
 * L'autenticazione è a sessione (cookie `JSESSIONID` + XSRF `X-XSRF-TOKEN`,
 * già configurati in `provideCore()`), quindi qui non si aggiungono header auth.
 *
 * Esempio:
 * ```ts
 * this.consoleApi.list<PendenzaSummary>('pendenze', { page: 1, limit: 25 });
 * this.consoleApi.get<Pendenza>(`pendenze/${idA2A}/${idPendenza}`);
 * this.consoleApi.getBlob(`pendenze/${idA2A}/${idPendenza}/avviso`, 'application/pdf');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConsoleApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /** Base URL della console-api, senza slash finale. */
  baseUrl(): string {
    const govapi = this.config.appConfig()?.GOVAPI as GovApiConfigWithConsole | undefined;
    const base = govapi?.CONSOLE || DEFAULT_CONSOLE_BASE;
    return base.replace(/\/+$/, '');
  }

  /** Compone l'URL assoluto per un path relativo (accetta con/senza slash iniziale). */
  urlFor(path: string): string {
    const clean = path.replace(/^\/+/, '');
    return `${this.baseUrl()}/${clean}`;
  }

  /**
   * `GET` di una lista paginata → `Slice<T>`.
   * `params` include paginazione (`page`/`limit`/`sort`/`total`/`cursor`) e
   * filtri di risorsa; le chiavi con valore vuoto/undefined sono omesse.
   */
  list<T>(path: string, params: Record<string, ParamValue> = {}): Observable<Slice<T>> {
    return this.http.get<Slice<T>>(this.urlFor(path), { params: this.toParams(params) });
  }

  /** `GET` di una singola risorsa JSON. */
  get<T>(path: string, params: Record<string, ParamValue> = {}): Observable<T> {
    return this.http.get<T>(this.urlFor(path), { params: this.toParams(params) });
  }

  /**
   * `GET` di una risorsa binaria (es. avviso PDF, ricevuta XML/PDF).
   * `accept` popola l'header `Accept` per la content-negotiation.
   */
  getBlob(
    path: string,
    accept: string,
    params: Record<string, ParamValue> = {},
  ): Observable<Blob> {
    return this.http.get(this.urlFor(path), {
      params: this.toParams(params),
      headers: new HttpHeaders({ Accept: accept }),
      responseType: 'blob',
    });
  }

  /** Richiesta arbitraria (POST/PUT/PATCH/DELETE) su un path della console-api. */
  request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: { body?: unknown; params?: Record<string, ParamValue>; headers?: Record<string, string> } = {},
  ): Observable<T> {
    return this.http.request<T>(method, this.urlFor(path), {
      body: options.body,
      params: this.toParams(options.params ?? {}),
      headers: options.headers ? new HttpHeaders(options.headers) : undefined,
    });
  }

  /** Serializza un oggetto in `HttpParams`, omettendo `undefined`/`null`/`''`. */
  private toParams(input: Record<string, ParamValue>): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }
}
