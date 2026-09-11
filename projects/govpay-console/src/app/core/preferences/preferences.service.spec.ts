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
import { of } from 'rxjs';
import { ConsoleApiService } from '@core/services';
import { AuthService } from '@core/auth/services/auth.service';
import { PreferencesService } from './preferences.service';

interface PatchCall {
  path: string;
  ops: unknown;
}

function make(preferenze?: Record<string, unknown>) {
  const user = signal<Record<string, unknown> | null>(
    preferenze === undefined ? { id: 'u' } : { id: 'u', preferenze },
  );
  const patchCalls: PatchCall[] = [];
  const auth = {
    user: () => user(),
    setPreferenze: (p: Record<string, unknown>) => user.set({ ...(user() ?? {}), preferenze: p }),
  } as unknown as AuthService;
  const api = {
    patch: (path: string, ops: unknown) => {
      patchCalls.push({ path, ops });
      const current = (user()?.['preferenze'] as Record<string, unknown>) ?? {};
      return of({ body: { preferenze: current }, etag: null });
    },
  } as unknown as ConsoleApiService;

  const injector = Injector.create({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: ConsoleApiService, useValue: api },
      { provide: PreferencesService, deps: [] as never[] },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(PreferencesService));
  return { svc, patchCalls, user };
}

describe('PreferencesService', () => {
  it('utenza non-operatore: available=false, get→fallback, set no-op', () => {
    const { svc, patchCalls } = make(undefined);
    expect(svc.available()).toBe(false);
    expect(svc.get('colorScheme', 'auto')).toBe('auto');
    svc.set('colorScheme', 'dark');
    expect(patchCalls).toHaveLength(0);
  });

  it('operatore: legge le preferenze e ha available=true', () => {
    const { svc } = make({ colorScheme: 'dark' });
    expect(svc.available()).toBe(true);
    expect(svc.get('colorScheme', 'auto')).toBe('dark');
    expect(svc.get('locale', 'it')).toBe('it');
  });

  it('set(): op JSON Patch add /preferenze/<key> + aggiornamento ottimistico', () => {
    const { svc, patchCalls } = make({});
    svc.set('locale', 'en');
    expect(patchCalls[0].path).toBe('profilo');
    expect(patchCalls[0].ops).toEqual([{ op: 'add', path: '/preferenze/locale', value: 'en' }]);
    // aggiornamento ottimistico immediato
    expect(svc.get('locale', 'it')).toBe('en');
  });
});
