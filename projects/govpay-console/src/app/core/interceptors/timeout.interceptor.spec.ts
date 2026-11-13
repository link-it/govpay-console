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
import { Injector, runInInjectionContext, signal } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEventType,
  HttpRequest,
  HttpResponse,
  type HttpEvent,
  type HttpHandlerFn,
} from '@angular/common/http';
import { ConfigService } from '@linkit/shared-ui';
import { NEVER, concat, lastValueFrom, of, timer, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { timeoutInterceptor } from './timeout.interceptor';

function run(
  timeoutMs: number | null,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const injector = Injector.create({
    providers: [{ provide: ConfigService, useValue: { requestTimeout: signal(timeoutMs) } }],
  });
  return runInInjectionContext(injector, () => timeoutInterceptor(req, next));
}

const GET = new HttpRequest('GET', '/govpay-console-api/pendenze');
const SENT: HttpEvent<unknown> = { type: HttpEventType.Sent };
/** Backend che invia la richiesta e non risponde mai. */
const silent: HttpHandlerFn = () => concat(of(SENT), NEVER);

describe('timeoutInterceptor', () => {
  it('senza timeout configurato la richiesta passa invariata', () => {
    const source = of(SENT);
    expect(run(null, GET, () => source)).toBe(source);
  });

  it('i download blob sono esclusi dal timeout', () => {
    const source = of(SENT);
    const blobReq = GET.clone({ responseType: 'blob' });
    expect(run(10, blobReq, () => source)).toBe(source);
  });

  it('allo scadere fallisce con HttpErrorResponse status 0', async () => {
    const err = await lastValueFrom(run(10, GET, silent)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect((err as HttpErrorResponse).status).toBe(0);
    expect((err as HttpErrorResponse).url).toBe('/govpay-console-api/pendenze');
  });

  it('una risposta entro il timeout passa', async () => {
    const response = new HttpResponse({ status: 200, body: { ok: true } });
    const next: HttpHandlerFn = () => concat(of(SENT), timer(5).pipe(map(() => response)));
    const last = await lastValueFrom(run(1000, GET, next));
    expect(last).toBe(response);
  });

  it('gli altri errori passano invariati', async () => {
    const httpErr = new HttpErrorResponse({ status: 500 });
    const next: HttpHandlerFn = () => concat(of(SENT), timer(1).pipe(map(() => { throw httpErr; })));
    const err = await lastValueFrom(run(1000, GET, next)).catch((e: unknown) => e);
    expect(err).toBe(httpErr);
  });
});
