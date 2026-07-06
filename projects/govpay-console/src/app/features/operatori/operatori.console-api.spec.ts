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
import { OperatoriConsoleApi } from './operatori.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: OperatoriConsoleApi; calls: RecordedCall[] } {
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
      { provide: OperatoriConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(OperatoriConsoleApi));
  return { svc, calls };
}

describe('OperatoriConsoleApi', () => {
  it('list() inoltra i filtri su "operatori"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, principal: 'mario', abilitato: true });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'operatori',
      params: { page: 1, limit: 25, principal: 'mario', abilitato: true },
    });
  });

  it('get() encoda il principal nel path', () => {
    const { svc, calls } = makeApi();
    svc.get('mario@ente.it');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'operatori/mario%40ente.it' });
  });

  it('create() fa POST su "operatori"', () => {
    const { svc, calls } = makeApi();
    svc.create({ principal: 'mario', nome: 'Mario', abilitato: true });
    expect(calls[0]).toMatchObject({ method: 'post', path: 'operatori' });
  });

  it('replace() fa PUT con If-Match', () => {
    const { svc, calls } = makeApi();
    svc.replace('mario', { nome: 'Mario', abilitato: false }, 'W/"1"');
    expect(calls[0].method).toBe('put');
    expect(calls[0].path).toBe('operatori/mario');
    expect((calls[0].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });
});
