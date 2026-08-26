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
import { ImpostazioniConsoleApi } from './impostazioni.console-api';

interface RecordedCall {
  method: string;
  path: string;
  ifMatch?: string | null;
}

function makeApi(): { svc: ImpostazioniConsoleApi; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fake = {
    get: (path: string) => {
      calls.push({ method: 'get', path });
      return of({});
    },
    getWithETag: (path: string) => {
      calls.push({ method: 'getWithETag', path });
      return of({ body: {}, etag: null });
    },
    put: (path: string, _body: unknown, ifMatch?: string | null) => {
      calls.push({ method: 'put', path, ifMatch });
      return of({ body: {}, etag: 'v2' });
    },
    putVoid: (path: string) => {
      calls.push({ method: 'putVoid', path });
      return of(undefined);
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: ConsoleApiService, useValue: fake },
      { provide: ImpostazioniConsoleApi, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(ImpostazioniConsoleApi));
  return { svc, calls };
}

describe('ImpostazioniConsoleApi', () => {
  it('overview() legge /impostazioni', () => {
    const { svc, calls } = makeApi();
    svc.overview();
    expect(calls[0]).toEqual({ method: 'get', path: 'impostazioni' });
  });

  it('servizioGDE: GET(+ETag), PUT(If-Match) e credenziali write-only', () => {
    const { svc, calls } = makeApi();
    svc.getServizioGde();
    svc.putServizioGde({ abilitato: true }, 'v1');
    svc.putServizioGdeCredenziali({ password: 'x' });
    expect(calls[0]).toEqual({ method: 'getWithETag', path: 'impostazioni/servizioGDE' });
    expect(calls[1]).toEqual({ method: 'put', path: 'impostazioni/servizioGDE', ifMatch: 'v1' });
    expect(calls[2]).toEqual({ method: 'putVoid', path: 'impostazioni/servizioGDE/credenziali' });
  });

  it('espone i path corretti delle sotto-aree', () => {
    const { svc, calls } = makeApi();
    svc.getGiornaleEventi();
    svc.getMailServer();
    svc.putMailServerPassword({ nuovaPassword: 'p' });
    svc.getMailTemplate();
    svc.getAppIoServer();
    svc.getAppIoTemplate();
    svc.getTracciatiCsv();
    svc.getHardening();
    svc.putHardeningCredenziali({ secretKey: 's' });
    const paths = calls.map((c) => c.path);
    expect(paths).toEqual([
      'impostazioni/giornale-eventi',
      'impostazioni/mail/server',
      'impostazioni/mail/server/password',
      'impostazioni/mail/template-promemoria',
      'impostazioni/app-io/server',
      'impostazioni/app-io/template-promemoria',
      'impostazioni/tracciati-csv',
      'impostazioni/hardening',
      'impostazioni/hardening/credenziali',
    ]);
  });
});
