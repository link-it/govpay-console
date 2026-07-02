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

import { describe, expect, it, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';
import { ConsoleApiService } from '@core/services';
import { IntermediariConsoleApi } from './intermediari.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: IntermediariConsoleApi; calls: RecordedCall[] } {
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
    putVoid: (path: string, body: unknown) => {
      calls.push({ method: 'putVoid', path, params: body });
      return of(undefined);
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: IntermediariConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(IntermediariConsoleApi));
  return { svc, calls };
}

describe('IntermediariConsoleApi', () => {
  it('list() inoltra i filtri su "intermediari"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, codIntermediario: 'AG', abilitato: true });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'intermediari',
      params: { page: 1, limit: 25, codIntermediario: 'AG', abilitato: true },
    });
  });

  it('get() encoda l’id nel path', () => {
    const { svc, calls } = makeApi();
    svc.get('int/1');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'intermediari/int%2F1' });
  });

  it('listStazioni() punta alla sub-resource stazioni', () => {
    const { svc, calls } = makeApi();
    svc.listStazioni('INT', { codStazione: 'X' });
    expect(calls[0]).toMatchObject({ method: 'list', path: 'intermediari/INT/stazioni' });
    expect(calls[0].params).toEqual({ codStazione: 'X' });
  });

  it('getStazione() compone il path con id stazione encodato', () => {
    const { svc, calls } = makeApi();
    svc.getStazione('INT', 'INT_1');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'intermediari/INT/stazioni/INT_1' });
  });

  it('getConnettore() usa il tipo come segmento', () => {
    const { svc, calls } = makeApi();
    svc.getConnettore('INT', 'pagopa-recupero-rt');
    expect(calls[0]).toMatchObject({
      method: 'get',
      path: 'intermediari/INT/connettori/pagopa-recupero-rt',
    });
  });

  it('create() fa POST su "intermediari"', () => {
    const { svc, calls } = makeApi();
    svc.create({ idIntermediario: 'A', denominazione: 'D', principalPagoPa: 'P', abilitato: true });
    expect(calls[0]).toMatchObject({ method: 'post', path: 'intermediari' });
  });

  it('replace() fa PUT con If-Match', () => {
    const { svc, calls } = makeApi();
    svc.replace('INT', { denominazione: 'D', principalPagoPa: 'P', abilitato: false }, 'W/"1"');
    expect(calls[0].method).toBe('put');
    expect(calls[0].path).toBe('intermediari/INT');
    expect((calls[0].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('replaceStazione() fa PUT sulla sub-resource', () => {
    const { svc, calls } = makeApi();
    svc.replaceStazione('INT', 'INT_1', { versione: 'V2', abilitato: true }, null);
    expect(calls[0]).toMatchObject({ method: 'put', path: 'intermediari/INT/stazioni/INT_1' });
  });

  it('putConnettoreCredenziali() fa PUT void su …/credenziali', () => {
    const { svc, calls } = makeApi();
    svc.putConnettoreCredenziali('INT', 'pagopa', { password: 'x' });
    expect(calls[0]).toMatchObject({
      method: 'putVoid',
      path: 'intermediari/INT/connettori/pagopa/credenziali',
    });
  });
});
