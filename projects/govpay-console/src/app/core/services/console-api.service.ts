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
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { ConfigService } from '@linkit/shared-ui';
import type { JsonPatchOp, Slice } from '@core/models';

/** Media type per i documenti JSON Patch (RFC 6902). */
const JSON_PATCH_CONTENT_TYPE = 'application/json-patch+json';

/** Valore ammissibile per un query param serializzabile. */
export type ParamValue = string | number | boolean | undefined | null;

/**
 * Body di una risorsa insieme al suo validatore di concorrenza `ETag`.
 * Usato per il pattern GET(+ETag) → PUT/PATCH con `If-Match`.
 */
export interface WithETag<T> {
  body: T;
  etag: string | null;
}

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
 * this.consoleApi.patch('impostazioni/mail/server', ops, etag); // Impostazioni (JSON Patch)
 * this.consoleApi.postMultipart('pendenze/tracciati', form);     // upload tracciato
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

  /* ── Concorrenza ottimistica (ETag / If-Match) ───────────────────── */

  /** `GET` che espone anche l'header `ETag` (da rispedire come `If-Match`). */
  getWithETag<T>(path: string, params: Record<string, ParamValue> = {}): Observable<WithETag<T>> {
    return this.http
      .get<T>(this.urlFor(path), { params: this.toParams(params), observe: 'response' })
      .pipe(map((res) => ({ body: res.body as T, etag: res.headers.get('ETag') })));
  }

  /** `POST` per la creazione: ritorna la risposta completa (header `Location`/`ETag`). */
  post<T>(path: string, body: unknown): Observable<HttpResponse<T>> {
    return this.http.post<T>(this.urlFor(path), body, { observe: 'response' });
  }

  /**
   * `POST` `multipart/form-data` (es. upload tracciato pendenze). Il
   * `Content-Type` (con boundary) è impostato automaticamente dal browser
   * quando il body è una `FormData`: non va forzato a mano. Ritorna la
   * risposta completa (header `Location`/`ETag`).
   */
  postMultipart<T>(path: string, form: FormData): Observable<HttpResponse<T>> {
    return this.http.post<T>(this.urlFor(path), form, { observe: 'response' });
  }

  /**
   * `PUT` (replace) con concorrenza ottimistica: invia `If-Match` se fornito e
   * ritorna body + nuovo `ETag`. Un 412 (ETag non combacia) / 428 (If-Match
   * mancante) arriva come `HttpErrorResponse` al `catchError` del chiamante.
   */
  put<T>(path: string, body: unknown, ifMatch?: string | null): Observable<WithETag<T>> {
    return this.http
      .put<T>(this.urlFor(path), body, {
        observe: 'response',
        headers: ifMatch ? new HttpHeaders({ 'If-Match': ifMatch }) : undefined,
      })
      .pipe(map((res) => ({ body: res.body as T, etag: res.headers.get('ETag') })));
  }

  /** `PUT` senza body di risposta (es. credenziali connettore → 204). */
  putVoid(path: string, body: unknown): Observable<void> {
    return this.http.put<void>(this.urlFor(path), body).pipe(map(() => undefined));
  }

  /**
   * `PATCH` **JSON Patch (RFC 6902)** con concorrenza ottimistica. Usato solo
   * dai singleton di configurazione dell'area Impostazioni (update parziale che
   * non azzera i campi non gestiti dalla UI); altrove si usa `put` (replace).
   *
   * Invia il documento con content-type `application/json-patch+json` e
   * `If-Match` se fornito; ritorna body + nuovo `ETag`. Un 412 (ETag non
   * combacia) / 428 (If-Match mancante) arriva come `HttpErrorResponse` al
   * `catchError` del chiamante.
   */
  patch<T>(path: string, ops: JsonPatchOp[], ifMatch?: string | null): Observable<WithETag<T>> {
    let headers = new HttpHeaders({ 'Content-Type': JSON_PATCH_CONTENT_TYPE });
    if (ifMatch) headers = headers.set('If-Match', ifMatch);
    return this.http
      .patch<T>(this.urlFor(path), ops, { observe: 'response', headers })
      .pipe(map((res) => ({ body: res.body as T, etag: res.headers.get('ETag') })));
  }

  /**
   * `PUT` di una risorsa binaria (es. logo dominio, png/jpeg). `contentType`
   * popola l'header `Content-Type`; `ifMatch` è opzionale (il logo non lo usa).
   */
  putBlob(path: string, blob: Blob, contentType: string, ifMatch?: string | null): Observable<void> {
    let headers = new HttpHeaders({ 'Content-Type': contentType });
    if (ifMatch) headers = headers.set('If-Match', ifMatch);
    return this.http.put<void>(this.urlFor(path), blob, { headers }).pipe(map(() => undefined));
  }

  /** `DELETE` di una risorsa (es. logo dominio). `ifMatch` opzionale. */
  delete(path: string, ifMatch?: string | null): Observable<void> {
    return this.http
      .delete<void>(this.urlFor(path), {
        headers: ifMatch ? new HttpHeaders({ 'If-Match': ifMatch }) : undefined,
      })
      .pipe(map(() => undefined));
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
