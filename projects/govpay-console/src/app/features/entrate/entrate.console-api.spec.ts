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
import { EntrateConsoleApi } from './entrate.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: EntrateConsoleApi; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fake = {
    list: (path: string, params: unknown) => {
      calls.push({ method: 'list', path, params });
      return of({ results: [] });
    },
    get: (path: string, params: unknown) => {
      calls.push({ method: 'get', path, params });
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
      { provide: EntrateConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(EntrateConsoleApi));
  return { svc, calls };
}

describe('EntrateConsoleApi', () => {
  it('list() inoltra i filtri su "entrate"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, idEntrata: 'TARI', descrizione: 'rif' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'entrate',
      params: { page: 1, limit: 25, idEntrata: 'TARI', descrizione: 'rif' },
    });
  });

  it('get() encoda l’id nel path', () => {
    const { svc, calls } = makeApi();
    svc.get('a/b');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'entrate/a%2Fb' });
  });

  it('create() fa POST su "entrate"', () => {
    const { svc, calls } = makeApi();
    svc.create({ idEntrata: 'TARI', descrizione: 'D', tipoContabilita: 'CAPITOLO', codiceContabilita: 'C1' });
    expect(calls[0]).toMatchObject({ method: 'post', path: 'entrate' });
  });

  it('replace() fa PUT con If-Match', () => {
    const { svc, calls } = makeApi();
    svc.replace('TARI', { descrizione: 'D', tipoContabilita: 'ALTRO', codiceContabilita: 'C2' }, 'W/"1"');
    expect(calls[0].method).toBe('put');
    expect(calls[0].path).toBe('entrate/TARI');
    expect((calls[0].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });
});
