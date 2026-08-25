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
import { OperazioniConsoleApi } from './operazioni.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
  body?: unknown;
}

function makeApi(): { svc: OperazioniConsoleApi; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fake = {
    get: (path: string) => {
      calls.push({ method: 'get', path });
      return of(path === 'operazioni' ? [] : {});
    },
    list: (path: string, params: unknown) => {
      calls.push({ method: 'list', path, params });
      return of({ results: [] });
    },
    post: (path: string, body: unknown) => {
      calls.push({ method: 'post', path, body });
      return of(new HttpResponse({ body: { idEsecuzione: 'e1' } }));
    },
    delete: (path: string) => {
      calls.push({ method: 'delete', path });
      return of(undefined);
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: OperazioniConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(OperazioniConsoleApi));
  return { svc, calls };
}

describe('OperazioniConsoleApi', () => {
  it('list() legge il catalogo (array) su "operazioni"', () => {
    const { svc, calls } = makeApi();
    svc.list();
    expect(calls[0]).toEqual({ method: 'get', path: 'operazioni' });
  });

  it('listEsecuzioni() inoltra i filtri offset sul path esecuzioni', () => {
    const { svc, calls } = makeApi();
    svc.listEsecuzioni('RND', { page: 2, limit: 25, statoEsecuzione: 'IN_CORSO' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'operazioni/RND/esecuzioni',
      params: { page: 2, limit: 25, statoEsecuzione: 'IN_CORSO' },
    });
  });

  it('getEsecuzione() punta alla singola esecuzione', () => {
    const { svc, calls } = makeApi();
    svc.getEsecuzione('RND', 'e42');
    expect(calls[0]).toEqual({ method: 'get', path: 'operazioni/RND/esecuzioni/e42' });
  });

  it('avvia() fa POST con il body e ritorna l’esecuzione creata', () => {
    const { svc, calls } = makeApi();
    let created: { idEsecuzione: string } | undefined;
    svc.avvia('RND', { force: true }).subscribe((e) => (created = e));
    expect(calls[0]).toEqual({ method: 'post', path: 'operazioni/RND/esecuzioni', body: { force: true } });
    expect(created).toEqual({ idEsecuzione: 'e1' });
  });

  it('annulla() fa DELETE sulla singola esecuzione', () => {
    const { svc, calls } = makeApi();
    svc.annulla('RND', 'e42');
    expect(calls[0]).toEqual({ method: 'delete', path: 'operazioni/RND/esecuzioni/e42' });
  });
});
