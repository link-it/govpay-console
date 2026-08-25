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

import { describe, expect, it, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ConfigService } from '@linkit/shared-ui';
import { ConsoleApiService } from './console-api.service';
import type { JsonPatchOp } from '@core/models';

/** Crea una ConsoleApiService con ConfigService/HttpClient stubbati. */
function makeService(consoleBase?: string, http: Partial<HttpClient> = {}): ConsoleApiService {
  const fakeConfig = {
    appConfig: () => (consoleBase === undefined ? undefined : { GOVAPI: { CONSOLE: consoleBase } }),
  } as unknown as ConfigService;

  const injector = Injector.create({
    providers: [
      { provide: HttpClient, useValue: http as HttpClient },
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

  describe('patch (JSON Patch RFC 6902)', () => {
    const ops: JsonPatchOp[] = [{ op: 'replace', path: '/abilitato', value: false }];

    it('invia il documento con content-type json-patch e If-Match, ritorna body+etag', () => {
      const patch = vi.fn().mockReturnValue(
        of(new HttpResponse({ body: { abilitato: false }, headers: new HttpHeaders({ ETag: 'v2' }) })),
      );
      const svc = makeService('/govpay-console-api', { patch });

      let result: { body: unknown; etag: string | null } | undefined;
      svc.patch('impostazioni/mail/server', ops, 'v1').subscribe((r) => (result = r));

      expect(patch).toHaveBeenCalledTimes(1);
      const [url, body, options] = patch.mock.calls[0];
      expect(url).toBe('/govpay-console-api/impostazioni/mail/server');
      expect(body).toBe(ops);
      expect(options.observe).toBe('response');
      const headers = options.headers as HttpHeaders;
      expect(headers.get('Content-Type')).toBe('application/json-patch+json');
      expect(headers.get('If-Match')).toBe('v1');
      expect(result).toEqual({ body: { abilitato: false }, etag: 'v2' });
    });

    it('omette If-Match se non fornito', () => {
      const patch = vi.fn().mockReturnValue(of(new HttpResponse({ body: {}, headers: new HttpHeaders() })));
      const svc = makeService('/govpay-console-api', { patch });

      svc.patch('impostazioni/hardening', ops).subscribe();

      const headers = patch.mock.calls[0][2].headers as HttpHeaders;
      expect(headers.get('Content-Type')).toBe('application/json-patch+json');
      expect(headers.has('If-Match')).toBe(false);
    });
  });

  describe('postMultipart', () => {
    it('inoltra la FormData senza forzare il Content-Type, con query params', () => {
      const post = vi.fn().mockReturnValue(of(new HttpResponse({ body: { id: 't1' } })));
      const svc = makeService('/govpay-console-api', { post });
      const form = new FormData();
      form.append('file', new Blob(['a;b;c']), 'tracciato.csv');

      svc.postMultipart('pendenze/tracciati', form, { idDominio: '12345678901', formato: 'CSV' }).subscribe();

      expect(post).toHaveBeenCalledTimes(1);
      const [url, body, options] = post.mock.calls[0];
      expect(url).toBe('/govpay-console-api/pendenze/tracciati');
      expect(body).toBe(form);
      expect(options.observe).toBe('response');
      expect(options.params.get('idDominio')).toBe('12345678901');
      expect(options.params.get('formato')).toBe('CSV');
    });
  });
});
