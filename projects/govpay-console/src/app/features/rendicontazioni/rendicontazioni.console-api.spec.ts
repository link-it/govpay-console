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
import { RendicontazioniConsoleApi } from './rendicontazioni.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
  accept?: string;
}

function makeApi(): { svc: RendicontazioniConsoleApi; calls: RecordedCall[] } {
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
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: RendicontazioniConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(RendicontazioniConsoleApi));
  return { svc, calls };
}

describe('RendicontazioniConsoleApi', () => {
  it('list() inoltra i filtri su "flussi-rendicontazione"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, stato: 'ACQUISITO', idPsp: 'BPPIITRRXXX' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'flussi-rendicontazione',
      params: { page: 1, limit: 25, stato: 'ACQUISITO', idPsp: 'BPPIITRRXXX' },
    });
  });

  it('get() compone la quaterna (idDominio, idFlusso, idPsp, revisione)', () => {
    const { svc, calls } = makeApi();
    svc.get('12345678901', '2026-08-01ABI/01', 'BPPIITRRXXX', 2);
    expect(calls[0]).toEqual({
      method: 'get',
      path: 'flussi-rendicontazione/12345678901/2026-08-01ABI%2F01/BPPIITRRXXX/2',
    });
  });

  it('getXml() punta allo stesso path con Accept application/xml', () => {
    const { svc, calls } = makeApi();
    svc.getXml('12345678901', 'FLX1', 'BPPIITRRXXX', 1);
    expect(calls[0]).toEqual({
      method: 'getBlob',
      path: 'flussi-rendicontazione/12345678901/FLX1/BPPIITRRXXX/1',
      accept: 'application/xml',
    });
  });
});
