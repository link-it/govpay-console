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
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@linkit/shared-ui';
import { ConsoleApiService } from './console-api.service';

/** Crea una ConsoleApiService con ConfigService/HttpClient stubbati. */
function makeService(consoleBase?: string): ConsoleApiService {
  const fakeConfig = {
    appConfig: () => (consoleBase === undefined ? undefined : { GOVAPI: { CONSOLE: consoleBase } }),
  } as unknown as ConfigService;

  const injector = Injector.create({
    providers: [
      { provide: HttpClient, useValue: {} as HttpClient },
      { provide: ConfigService, useValue: fakeConfig },
      { provide: ConsoleApiService, deps: [] as never[] },
    ],
  });
  return runInInjectionContext(injector, () => injector.get(ConsoleApiService));
}

describe('ConsoleApiService', () => {
  describe('baseUrl', () => {
    it('legge GOVAPI.CONSOLE dalla config', () => {
      expect(makeService('/govpay-console-api').baseUrl()).toBe('/govpay-console-api');
    });
    it('ripiega sul default se CONSOLE non è configurato', () => {
      expect(makeService(undefined).baseUrl()).toBe('/govpay-console-api');
    });
    it('rimuove lo slash finale', () => {
      expect(makeService('/govpay-console-api/').baseUrl()).toBe('/govpay-console-api');
    });
  });

  describe('urlFor', () => {
    it('compone base + path normalizzando gli slash', () => {
      const svc = makeService('/govpay-console-api');
      expect(svc.urlFor('pendenze')).toBe('/govpay-console-api/pendenze');
      expect(svc.urlFor('/pendenze')).toBe('/govpay-console-api/pendenze');
      expect(svc.urlFor('pendenze/A2A/ID/avviso')).toBe('/govpay-console-api/pendenze/A2A/ID/avviso');
    });
  });
});
