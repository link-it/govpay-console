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
import { of } from 'rxjs';
import { ConsoleApiService } from '@core/services';
import { TipiPendenzaConsoleApi } from './tipi-pendenza.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: TipiPendenzaConsoleApi; calls: RecordedCall[] } {
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
    getWithETag: (path: string) => {
      calls.push({ method: 'getWithETag', path });
      return of({ body: {}, etag: 'W/"1"' });
    },
    post: (path: string, body: unknown) => {
      calls.push({ method: 'post', path, params: body });
      return of({ body: {} });
    },
    put: (path: string, body: unknown, ifMatch: unknown) => {
      calls.push({ method: 'put', path, params: { body, ifMatch } });
      return of({ body: {}, etag: 'W/"2"' });
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: TipiPendenzaConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(TipiPendenzaConsoleApi));
  return { svc, calls };
}

describe('TipiPendenzaConsoleApi', () => {
  it('list() inoltra i filtri su "tipiPendenza"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, idTipoPendenza: 'TARI', abilitato: true });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'tipiPendenza',
      params: { page: 1, limit: 25, idTipoPendenza: 'TARI', abilitato: true },
    });
  });

  it('get() encoda l’id nel path', () => {
    const { svc, calls } = makeApi();
    svc.get('a/b');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'tipiPendenza/a%2Fb' });
  });

  it('create() fa POST su "tipiPendenza"', () => {
    const { svc, calls } = makeApi();
    svc.create({ idTipoPendenza: 'TARI', descrizione: 'D' });
    expect(calls[0]).toMatchObject({ method: 'post', path: 'tipiPendenza' });
  });

  it('replace() fa PUT con If-Match', () => {
    const { svc, calls } = makeApi();
    svc.replace('TARI', { descrizione: 'D', abilitato: true }, 'W/"1"');
    expect(calls[0].method).toBe('put');
    expect(calls[0].path).toBe('tipiPendenza/TARI');
    expect((calls[0].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });
});
