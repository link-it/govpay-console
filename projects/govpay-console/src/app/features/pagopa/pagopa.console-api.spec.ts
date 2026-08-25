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
import { PagopaConsoleApi } from './pagopa.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: PagopaConsoleApi; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fake = {
    list: (path: string, params: unknown) => {
      calls.push({ method: 'list', path, params });
      return of({ results: [] });
    },
    get: (path: string, params: unknown) => {
      calls.push({ method: 'get', path, params });
      return of(path.startsWith('pagopa/iban') ? [] : {});
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: PagopaConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(PagopaConsoleApi));
  return { svc, calls };
}

describe('PagopaConsoleApi', () => {
  it('listEntiCreditori() inoltra la ricerca su "pagopa/enti-creditori"', () => {
    const { svc, calls } = makeApi();
    svc.listEntiCreditori({ search: 'comune', limit: 10 });
    expect(calls[0]).toEqual({ method: 'list', path: 'pagopa/enti-creditori', params: { search: 'comune', limit: 10 } });
  });

  it('getEnteCreditore() compone il path con taxCode url-encoded', () => {
    const { svc, calls } = makeApi();
    svc.getEnteCreditore('01234567890');
    expect(calls[0]).toEqual({ method: 'get', path: 'pagopa/enti-creditori/01234567890', params: undefined });
  });

  it('listIban() passa idDominio in query', () => {
    const { svc, calls } = makeApi();
    svc.listIban('01234567890');
    expect(calls[0]).toEqual({ method: 'get', path: 'pagopa/iban', params: { idDominio: '01234567890' } });
  });
});
