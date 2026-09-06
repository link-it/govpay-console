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
    putVoid: (path: string, body: unknown) => {
      calls.push({ method: 'putVoid', path, params: body });
      return of(undefined);
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

  it('unità operative: list/get/create/replace sui path corretti', () => {
    const { svc, calls } = makeApi();
    svc.listUnitaOperative('12345678901', { limit: 200 });
    svc.getUnitaOperativaWithETag('12345678901', 'UO/1');
    svc.createUnitaOperativa('12345678901', { idUnitaOperativa: 'UO1', ragioneSociale: 'X', abilitato: true });
    svc.replaceUnitaOperativa('12345678901', 'UO/1', { ragioneSociale: 'Y', abilitato: true }, 'W/"1"');
    expect(calls[0]).toMatchObject({ method: 'list', path: 'domini/12345678901/unitaOperative' });
    expect(calls[1]).toMatchObject({ method: 'getWithETag', path: 'domini/12345678901/unitaOperative/UO%2F1' });
    expect(calls[2]).toMatchObject({ method: 'post', path: 'domini/12345678901/unitaOperative' });
    expect(calls[3]).toMatchObject({ method: 'put', path: 'domini/12345678901/unitaOperative/UO%2F1' });
    expect((calls[3].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('conti accredito: list/get/create/replace sui path corretti', () => {
    const { svc, calls } = makeApi();
    svc.listContiAccredito('12345678901', { limit: 200 });
    svc.getContoAccreditoWithETag('12345678901', 'IT60X0542811101000000123456');
    svc.createContoAccredito('12345678901', { ibanAccredito: 'IT60X0542811101000000123456', postale: false, abilitato: true });
    svc.replaceContoAccredito('12345678901', 'IT60X0542811101000000123456', { postale: false, abilitato: true }, 'W/"1"');
    expect(calls[0]).toMatchObject({ method: 'list', path: 'domini/12345678901/contiAccredito' });
    expect(calls[1]).toMatchObject({ method: 'getWithETag', path: 'domini/12345678901/contiAccredito/IT60X0542811101000000123456' });
    expect(calls[2]).toMatchObject({ method: 'post', path: 'domini/12345678901/contiAccredito' });
    expect(calls[3]).toMatchObject({ method: 'put', path: 'domini/12345678901/contiAccredito/IT60X0542811101000000123456' });
    expect((calls[3].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('entrate dominio: list/get/create/replace sui path corretti', () => {
    const { svc, calls } = makeApi();
    svc.listEntrate('12345678901', { limit: 200 });
    svc.getEntrataWithETag('12345678901', 'TARI');
    svc.createEntrata('12345678901', { idEntrata: 'TARI', abilitato: true });
    svc.replaceEntrata('12345678901', 'TARI', { abilitato: false }, 'W/"1"');
    expect(calls[0]).toMatchObject({ method: 'list', path: 'domini/12345678901/entrate' });
    expect(calls[1]).toMatchObject({ method: 'getWithETag', path: 'domini/12345678901/entrate/TARI' });
    expect(calls[2]).toMatchObject({ method: 'post', path: 'domini/12345678901/entrate' });
    expect(calls[3]).toMatchObject({ method: 'put', path: 'domini/12345678901/entrate/TARI' });
    expect((calls[3].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('tipi pendenza dominio: list/get/create/replace sui path corretti', () => {
    const { svc, calls } = makeApi();
    svc.listTipiPendenza('12345678901', { limit: 200 });
    svc.getTipoPendenzaWithETag('12345678901', 'LIBERO');
    svc.createTipoPendenza('12345678901', { idTipoPendenza: 'LIBERO' });
    svc.replaceTipoPendenza('12345678901', 'LIBERO', { abilitato: true }, 'W/"1"');
    expect(calls[0]).toMatchObject({ method: 'list', path: 'domini/12345678901/tipiPendenza' });
    expect(calls[1]).toMatchObject({ method: 'getWithETag', path: 'domini/12345678901/tipiPendenza/LIBERO' });
    expect(calls[2]).toMatchObject({ method: 'post', path: 'domini/12345678901/tipiPendenza' });
    expect(calls[3]).toMatchObject({ method: 'put', path: 'domini/12345678901/tipiPendenza/LIBERO' });
    expect((calls[3].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
  });

  it('connettori dominio: get/replace/credenziali sui path corretti', () => {
    const { svc, calls } = makeApi();
    svc.getConnettoreWithETag('12345678901', 'mypivot');
    svc.replaceConnettore('12345678901', 'hypersic-apk', { abilitato: true }, 'W/"1"');
    svc.putCredenzialiConnettore('12345678901', 'govpay', { password: 'x' });
    expect(calls[0]).toMatchObject({ method: 'getWithETag', path: 'domini/12345678901/connettori/mypivot' });
    expect(calls[1]).toMatchObject({ method: 'put', path: 'domini/12345678901/connettori/hypersic-apk' });
    expect((calls[1].params as { ifMatch: string }).ifMatch).toBe('W/"1"');
    expect(calls[2]).toMatchObject({ method: 'putVoid', path: 'domini/12345678901/connettori/govpay/credenziali' });
  });
});
