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
import { PendenzeConsoleApi } from './pendenze.console-api';

interface RecordedCall {
  method: string;
  path: string;
  extra?: unknown;
}

/** Crea PendenzeConsoleApi con una ConsoleApiService stub che registra le chiamate. */
function makeApi(): { svc: PendenzeConsoleApi; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fake = {
    list: (path: string, params: unknown) => {
      calls.push({ method: 'list', path, extra: params });
      return of({ results: [] });
    },
    get: (path: string, params: unknown) => {
      calls.push({ method: 'get', path, extra: params });
      return of({});
    },
    getBlob: (path: string, accept: string, params: unknown) => {
      calls.push({ method: 'getBlob', path, extra: { accept, params } });
      return of(new Blob());
    },
    request: (method: string, path: string, options: unknown) => {
      calls.push({ method: `request:${method}`, path, extra: options });
      return of({});
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: PendenzeConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(PendenzeConsoleApi));
  return { svc, calls };
}

describe('PendenzeConsoleApi', () => {
  it('list() inoltra i filtri a ConsoleApiService.list su "pendenze"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, idDominio: '12345678901' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'pendenze',
      extra: { page: 1, limit: 25, idDominio: '12345678901' },
    });
  });

  it('get() compone il path e encoda i segmenti', () => {
    const { svc, calls } = makeApi();
    svc.get('a b', 'id/x');
    expect(calls[0].method).toBe('get');
    expect(calls[0].path).toBe('pendenze/a%20b/id%2Fx');
  });

  it('getInformazioniDebitore() punta alla sub-resource', () => {
    const { svc, calls } = makeApi();
    svc.getInformazioniDebitore('A2A', 'ID');
    expect(calls[0].path).toBe('pendenze/A2A/ID/informazioniDebitore');
  });

  it('listRicevute() punta a …/ricevute', () => {
    const { svc, calls } = makeApi();
    svc.listRicevute('A2A', 'ID');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'pendenze/A2A/ID/ricevute' });
  });

  it('getAvvisoJson() usa request GET con Accept json e linguaSecondaria', () => {
    const { svc, calls } = makeApi();
    svc.getAvvisoJson('A2A', 'ID', 'DE');
    expect(calls[0].method).toBe('request:GET');
    expect(calls[0].path).toBe('pendenze/A2A/ID/avviso');
    expect(calls[0].extra).toEqual({
      headers: { Accept: 'application/json' },
      params: { linguaSecondaria: 'DE' },
    });
  });

  it('getAvvisoPdf() usa getBlob con Accept pdf', () => {
    const { svc, calls } = makeApi();
    svc.getAvvisoPdf('A2A', 'ID');
    expect(calls[0].method).toBe('getBlob');
    expect(calls[0].path).toBe('pendenze/A2A/ID/avviso');
    expect(calls[0].extra).toEqual({ accept: 'application/pdf', params: { linguaSecondaria: undefined } });
  });
});
