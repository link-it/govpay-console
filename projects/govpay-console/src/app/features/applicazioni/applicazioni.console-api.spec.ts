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
import { ApplicazioniConsoleApi } from './applicazioni.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: ApplicazioniConsoleApi; calls: RecordedCall[] } {
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
    putVoid: (path: string, body: unknown) => {
      calls.push({ method: 'putVoid', path, params: body });
      return of(undefined);
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: ApplicazioniConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(ApplicazioniConsoleApi));
  return { svc, calls };
}

describe('ApplicazioniConsoleApi', () => {
  it('list() inoltra i filtri su "applicazioni"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, idA2A: 'APP', abilitato: true });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'applicazioni',
      params: { page: 1, limit: 25, idA2A: 'APP', abilitato: true },
    });
  });

  it('replace() fa PUT con If-Match', () => {
    const { svc, calls } = makeApi();
    svc.replace('APP', { principal: 'p', abilitato: true }, 'W/"1"');
    expect(calls[0]).toMatchObject({ method: 'put', path: 'applicazioni/APP' });
    expect((calls[0].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('getConnettoreIntegrazione() punta alla sub-resource', () => {
    const { svc, calls } = makeApi();
    svc.getConnettoreIntegrazione('APP');
    expect(calls[0]).toMatchObject({ method: 'get', path: 'applicazioni/APP/connettore-integrazione' });
  });

  it('putConnettoreIntegrazioneCredenziali() fa PUT void su …/credenziali', () => {
    const { svc, calls } = makeApi();
    svc.putConnettoreIntegrazioneCredenziali('APP', { password: 'x' });
    expect(calls[0]).toMatchObject({
      method: 'putVoid',
      path: 'applicazioni/APP/connettore-integrazione/credenziali',
    });
  });

  it('putPassword() fa PUT void su …/password con nuovaPassword', () => {
    const { svc, calls } = makeApi();
    svc.putPassword('APP', 'Segreta01');
    expect(calls[0]).toEqual({ method: 'putVoid', path: 'applicazioni/APP/password', params: { nuovaPassword: 'Segreta01' } });
  });
});
