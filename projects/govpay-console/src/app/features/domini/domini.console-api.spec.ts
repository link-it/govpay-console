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
import { DominiConsoleApi } from './domini.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
}

function makeApi(): { svc: DominiConsoleApi; calls: RecordedCall[] } {
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
    getBlob: (path: string) => {
      calls.push({ method: 'getBlob', path });
      return of(new Blob());
    },
    putBlob: (path: string) => {
      calls.push({ method: 'putBlob', path });
      return of(undefined);
    },
    delete: (path: string) => {
      calls.push({ method: 'delete', path });
      return of(undefined);
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: DominiConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(DominiConsoleApi));
  return { svc, calls };
}

describe('DominiConsoleApi', () => {
  it('list() inoltra i filtri su "domini"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, idDominio: '12', abilitato: true });
    expect(calls[0]).toEqual({ method: 'list', path: 'domini', params: { page: 1, limit: 25, idDominio: '12', abilitato: true } });
  });

  it('replace() fa PUT con If-Match', () => {
    const { svc, calls } = makeApi();
    svc.replace('12345678901', { ragioneSociale: 'X', abilitato: true, scaricaFr: false }, 'W/"1"');
    expect(calls[0]).toMatchObject({ method: 'put', path: 'domini/12345678901' });
    expect((calls[0].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('logo: getLogo/putLogo/deleteLogo puntano a …/logo', () => {
    const { svc, calls } = makeApi();
    svc.getLogo('12345678901');
    svc.putLogo('12345678901', new Blob([''], { type: 'image/png' }));
    svc.deleteLogo('12345678901');
    expect(calls.map((c) => c.method)).toEqual(['getBlob', 'putBlob', 'delete']);
    expect(calls.every((c) => c.path === 'domini/12345678901/logo')).toBe(true);
  });
});
