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
import { GiornaleEventiConsoleApi } from './giornale-eventi.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: GiornaleEventiConsoleApi; calls: RecordedCall[] } {
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
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: GiornaleEventiConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(GiornaleEventiConsoleApi));
  return { svc, calls };
}

describe('GiornaleEventiConsoleApi', () => {
  it('list() inoltra i filtri su "eventi"', () => {
    const { svc, calls } = makeApi();
    svc.list({ limit: 25, esito: 'KO', iuv: 'ABC', dataDa: '2026-08-01T00:00' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'eventi',
      params: { limit: 25, esito: 'KO', iuv: 'ABC', dataDa: '2026-08-01T00:00' },
    });
  });

  it('list() in cursor mode passa il solo cursor+limit', () => {
    const { svc, calls } = makeApi();
    svc.list({ cursor: 'opaque==', limit: 25 });
    expect(calls[0].params).toEqual({ cursor: 'opaque==', limit: 25 });
  });

  it('get() punta a eventi/{id} con id url-encoded', () => {
    const { svc, calls } = makeApi();
    svc.get(42);
    expect(calls[0]).toEqual({ method: 'get', path: 'eventi/42', params: undefined });
  });

  it('getRichiesta/getRisposta puntano ai sub-resource; unmask solo se richiesto', () => {
    const { svc, calls } = makeApi();
    svc.getRichiesta(7);
    svc.getRisposta(7, true);
    expect(calls[0]).toEqual({ method: 'get', path: 'eventi/7/richiesta', params: {} });
    expect(calls[1]).toEqual({ method: 'get', path: 'eventi/7/risposta', params: { unmask: true } });
  });
});
