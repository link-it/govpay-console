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

import { describe, expect, it } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ConsoleApiService } from '@core/services';
import { TracciatiConsoleApi } from './tracciati.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
  accept?: string;
}

function makeApi(): { svc: TracciatiConsoleApi; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fake = {
    list: (path: string, params: unknown) => {
      calls.push({ method: 'list', path, params });
      return of({ results: [] });
    },
    get: (path: string) => {
      calls.push({ method: 'get', path });
      return of({});
    },
    getBlob: (path: string, accept: string) => {
      calls.push({ method: 'getBlob', path, accept });
      return of(new Blob());
    },
    postMultipart: (path: string, _form: FormData, params: unknown) => {
      calls.push({ method: 'postMultipart', path, params });
      return of(new HttpResponse({ body: { id: 99 } }));
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: TracciatiConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(TracciatiConsoleApi));
  return { svc, calls };
}

describe('TracciatiConsoleApi', () => {
  it('list() inoltra i filtri su "pendenze/tracciati"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, stato: 'ESEGUITO', formatoRichiesta: 'CSV' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'pendenze/tracciati',
      params: { page: 1, limit: 25, stato: 'ESEGUITO', formatoRichiesta: 'CSV' },
    });
  });

  it('get() punta a pendenze/tracciati/{id}', () => {
    const { svc, calls } = makeApi();
    svc.get(123);
    expect(calls[0]).toEqual({ method: 'get', path: 'pendenze/tracciati/123' });
  });

  it('upload() invia multipart con idDominio/formato in query e ritorna il body', () => {
    const { svc, calls } = makeApi();
    const file = new File(['a;b;c'], 'pendenze.csv', { type: 'text/csv' });
    let created: { id: number } | undefined;
    svc.upload(file, { idDominio: '12345678901', formato: 'CSV' }).subscribe((t) => (created = t));
    expect(calls[0]).toEqual({
      method: 'postMultipart',
      path: 'pendenze/tracciati',
      params: { idDominio: '12345678901', formato: 'CSV', idTipoPendenza: undefined, stampaAvvisi: undefined },
    });
    expect(created).toEqual({ id: 99 });
  });

  it('sub-resource: richiesta/esito/stampe con Accept coerente', () => {
    const { svc, calls } = makeApi();
    svc.getRichiestaBlob(1, 'CSV');
    svc.getEsitoBlob(1, 'JSON');
    svc.getStampeBlob(1);
    expect(calls[0]).toEqual({ method: 'getBlob', path: 'pendenze/tracciati/1/richiesta', accept: 'text/csv' });
    expect(calls[1]).toEqual({ method: 'getBlob', path: 'pendenze/tracciati/1/esito', accept: 'application/json' });
    expect(calls[2]).toEqual({ method: 'getBlob', path: 'pendenze/tracciati/1/stampe', accept: 'application/zip' });
  });

  it('operazioni: lista (cursor) e dettaglio per numero', () => {
    const { svc, calls } = makeApi();
    svc.listOperazioni(7, { limit: 25 });
    svc.getOperazione(7, 3);
    expect(calls[0]).toEqual({ method: 'list', path: 'pendenze/tracciati/7/operazioni', params: { limit: 25 } });
    expect(calls[1]).toEqual({ method: 'get', path: 'pendenze/tracciati/7/operazioni/3' });
  });
});
