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
import { HttpClient, HttpParams } from '@angular/common/http';
import { type Observable } from 'rxjs';
import { ConfigService } from '@core/config';
import type { Pageable, TipoOggetto } from '@core/models';

/**
 * Wrapper tipizzato di `HttpClient` per le API GovPay.
 *
 * - URL base costruita da `AppConfig.GOVAPI.GOVPAY` (default `/govpay/backend/api/backoffice/rs`).
 * - Mappa `TipoOggetto` → segmento URL in `URL_BY_TIPO`.
 * - Tutti i metodi accettano un oggetto `params` (object → `HttpParams`) per ergonomia.
 *
 * Esempio:
 *   ```ts
 *   this.api.list<Pendenza>('pendenze', { pagina: 1, risPerPagina: 25 });
 *   ```
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Mappa `TipoOggetto` → segmento URL backend GovPay BO REST `form/v1`.
   *
   * Allineata ai path della console legacy
   * (`govpay-console-github/src/app/services/util.service.ts`):
   *   - `ricevute` → `rpp`        (Ricevute Pagamento PSP)
   *   - `rendicontazioni` → `flussiRendicontazione`
   *   - `tracciati` → `pendenze/tracciati`  (nidificato sotto pendenze)
   *   - `giornaleEventi` → `eventi`
   *   - `registroIntermediari` → `intermediari`
   *   - `tipiPendenze` → `tipiPendenza`
   */
  static readonly URL_BY_TIPO: Record<TipoOggetto, string> = {
    pendenze: 'pendenze',
    ricevute: 'rpp',
    pagamenti: 'pagamenti',
    registroIntermediari: 'intermediari',
    applicazioni: 'applicazioni',
    domini: 'domini',
    tipiPendenze: 'tipiPendenza',
    operatori: 'operatori',
    giornaleEventi: 'eventi',
    riscossioni: 'riscossioni',
    rendicontazioni: 'flussiRendicontazione',
    incassi: 'incassi',
    ruoli: 'ruoli',
    tracciati: 'pendenze/tracciati',
  };

  baseUrl(): string {
    return this.config.appConfig()?.GOVAPI.GOVPAY ?? '/govpay-api-backoffice/rs/form/v1';
  }

  /** Costruisce l'URL completo per un dato `TipoOggetto`. */
  urlFor(tipo: TipoOggetto, ...segments: string[]): string {
    const base = this.baseUrl();
    const path = ApiService.URL_BY_TIPO[tipo];
    return [base, path, ...segments.filter(Boolean)].join('/').replace(/\/+/g, '/');
  }

  list<T>(tipo: TipoOggetto, params: Record<string, string | number | boolean | undefined> = {}): Observable<Pageable<T>> {
    return this.http.get<Pageable<T>>(this.urlFor(tipo), { params: this.toParams(params) });
  }

  get<T>(tipo: TipoOggetto, id: string | number, params: Record<string, string | number | boolean | undefined> = {}): Observable<T> {
    return this.http.get<T>(this.urlFor(tipo, String(id)), { params: this.toParams(params) });
  }

  post<T>(tipo: TipoOggetto, body: unknown, ...segments: string[]): Observable<T> {
    return this.http.post<T>(this.urlFor(tipo, ...segments), body);
  }

  put<T>(tipo: TipoOggetto, id: string | number, body: unknown): Observable<T> {
    return this.http.put<T>(this.urlFor(tipo, String(id)), body);
  }

  patch<T>(tipo: TipoOggetto, id: string | number, body: unknown): Observable<T> {
    return this.http.patch<T>(this.urlFor(tipo, String(id)), body);
  }

  delete<T>(tipo: TipoOggetto, id: string | number): Observable<T> {
    return this.http.delete<T>(this.urlFor(tipo, String(id)));
  }

  /** Esegue una richiesta arbitraria su un URL relativo al base GovPay. */
  raw<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown, params: Record<string, string | number | boolean | undefined> = {}): Observable<T> {
    const url = `${this.baseUrl()}/${path}`.replace(/\/+/g, '/');
    return this.http.request<T>(method, url, {
      body,
      params: this.toParams(params),
    });
  }

  private toParams(input: Record<string, string | number | boolean | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }
}
