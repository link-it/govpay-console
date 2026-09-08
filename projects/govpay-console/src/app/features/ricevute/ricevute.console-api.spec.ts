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
import { RicevuteConsoleApi } from './ricevute.console-api';

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
  accept?: string;
  body?: unknown;
  hasFile?: boolean;
}

const SAMPLE_RT = { idDominio: '12345678901', iuv: 'IUV1', idRicevuta: 'RIC1' };

function makeApi(postStatus = 201): { svc: RicevuteConsoleApi; calls: RecordedCall[] } {
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
    postMultipart: (path: string, form: FormData) => {
      calls.push({ method: 'postMultipart', path, hasFile: form.has('file') });
      return of({ status: 201, body: SAMPLE_RT });
    },
    post: (path: string, body: unknown) => {
      calls.push({ method: 'post', path, body });
      return of({ status: postStatus, body: postStatus === 201 ? SAMPLE_RT : null });
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: RicevuteConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(RicevuteConsoleApi));
  return { svc, calls };
}

describe('RicevuteConsoleApi', () => {
  it('list() inoltra i filtri su "ricevute"', () => {
    const { svc, calls } = makeApi();
    svc.list({ page: 1, limit: 25, iuv: 'ABC', idDominio: '12345678901' });
    expect(calls[0]).toEqual({
      method: 'list',
      path: 'ricevute',
      params: { page: 1, limit: 25, iuv: 'ABC', idDominio: '12345678901' },
    });
  });

  it('get() compone la tupla (idDominio, iuv, idRicevuta)', () => {
    const { svc, calls } = makeApi();
    svc.get('12345678901', 'IUV1', 'RIC/1');
    expect(calls[0]).toEqual({ method: 'get', path: 'ricevute/12345678901/IUV1/RIC%2F1' });
  });

  it('getRptBlob/getRtBlob puntano ai sub-resource con Accept coerente', () => {
    const { svc, calls } = makeApi();
    svc.getRptBlob('12345678901', 'IUV1', 'RIC1', 'xml');
    svc.getRtBlob('12345678901', 'IUV1', 'RIC1', 'pdf');
    expect(calls[0]).toEqual({ method: 'getBlob', path: 'ricevute/12345678901/IUV1/RIC1/rpt', accept: 'application/xml' });
    expect(calls[1]).toEqual({ method: 'getBlob', path: 'ricevute/12345678901/IUV1/RIC1/rt', accept: 'application/pdf' });
  });

  it('upload() invia multipart su "ricevute" col campo file e ritorna il body', () => {
    const { svc, calls } = makeApi();
    let result: unknown;
    svc.upload(new File(['<xml/>'], 'rt.xml')).subscribe((r) => (result = r));
    expect(calls[0]).toEqual({ method: 'postMultipart', path: 'ricevute', hasFile: true });
    expect(result).toEqual(SAMPLE_RT);
  });

  it('recupera() mappa 201 in esito sincrono con ricevuta valorizzata', () => {
    const { svc, calls } = makeApi(201);
    let esito: { accodato: boolean; ricevuta: unknown } | undefined;
    svc.recupera({ idDominio: '12345678901', iuv: 'IUV1', idRicevuta: 'RIC1' }).subscribe((e) => (esito = e));
    expect(calls[0]).toEqual({
      method: 'post',
      path: 'ricevute/recuperi',
      body: { idDominio: '12345678901', iuv: 'IUV1', idRicevuta: 'RIC1' },
    });
    expect(esito).toEqual({ accodato: false, ricevuta: SAMPLE_RT });
  });

  it('recupera() mappa 202 in esito accodato senza ricevuta', () => {
    const { svc } = makeApi(202);
    let esito: { accodato: boolean; ricevuta: unknown } | undefined;
    svc.recupera({ idDominio: '12345678901', iuv: 'IUV1', idRicevuta: 'RIC1' }).subscribe((e) => (esito = e));
    expect(esito).toEqual({ accodato: true, ricevuta: null });
  });
});
