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

import { runInInjectionContext, Injector } from '@angular/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { AuthApi } from './auth.api';
import { ConfigService } from '@core/config';
import { mapProfileToUser, type AuthUser, type ProfiloResponse } from '../models/auth.model';

class FakeAuthApi {
  loginBasic = vi.fn();
  getProfile = vi.fn();
  logout = vi.fn();
}

class FakeConfigService {
  appConfig() {
    return {
      GOVAPI: { GOVPAY: '/api' },
      Auth: { Modes: ['Basic'], Default: 'Basic', Endpoints: { logout: '/logout' } },
    };
  }
}

function makeService(): { svc: AuthService; api: FakeAuthApi } {
  const api = new FakeAuthApi();
  const cfg = new FakeConfigService();
  const injector = Injector.create({
    providers: [
      { provide: AuthApi, useValue: api },
      { provide: ConfigService, useValue: cfg },
      { provide: AuthService, useFactory: () => new AuthService() },
    ],
  });
  const svc = runInInjectionContext(injector, () => injector.get(AuthService));
  return { svc, api };
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inizia non autenticato', () => {
    const { svc } = makeService();
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.user()).toBeNull();
  });

  it('loginBasic popola stato e persiste credenziali', async () => {
    const { svc, api } = makeService();
    const user: AuthUser = { id: 'u', username: 'u', acl: { hasPagamenti: true } };
    api.loginBasic.mockReturnValue(of(user));

    const result = await svc.loginBasic('u', 'p');

    expect(result).toEqual(user);
    expect(svc.isAuthenticated()).toBe(true);
    expect(svc.user()?.username).toBe('u');
    expect(svc.mode()).toBe('Basic');
    expect(svc.token()).toBe(btoa('u:p'));
    expect(svc.authorizationHeader()).toBe('Basic ' + btoa('u:p'));
    expect(localStorage.getItem('lnk-auth')).toContain('Basic');
  });

  it('loginBasic 401 imposta error e lascia non autenticato', async () => {
    const { svc, api } = makeService();
    api.loginBasic.mockReturnValue(throwError(() => ({ status: 401 })));

    await expect(svc.loginBasic('u', 'p')).rejects.toBeDefined();
    expect(svc.isAuthenticated()).toBe(false);
    expect(svc.error()).toMatch(/credenziali/i);
  });

  it('clear() resetta stato e localStorage', () => {
    const { svc } = makeService();
    localStorage.setItem('lnk-auth', '{}');
    svc.setUser({ id: '1', username: 'u' }, 'Basic', 'tok');
    expect(svc.isAuthenticated()).toBe(true);
    svc.clear();
    expect(svc.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('lnk-auth')).toBeNull();
  });

  it('authorizationHeader produce Bearer per OAuth2', () => {
    const { svc } = makeService();
    svc.setUser({ id: '1', username: 'u' }, 'OAuth2', 'tok123');
    expect(svc.authorizationHeader()).toBe('Bearer tok123');
  });
});

describe('mapProfileToUser', () => {
  const demoResponse: ProfiloResponse = {
    nome: 'Mario Rossi',
    domini: [{ idDominio: '*', ragioneSociale: 'Tutti' }],
    tipiPendenza: [
      { idTipoPendenza: '*', descrizione: 'Tutti', pagaTerzi: false, abilitato: true },
    ],
    acl: [
      { servizio: 'Anagrafica PagoPA', autorizzazioni: ['R', 'W'] },
      { servizio: 'Anagrafica Creditore', autorizzazioni: ['R', 'W'] },
      { servizio: 'Anagrafica Applicazioni', autorizzazioni: ['R', 'W'] },
      { servizio: 'Anagrafica Ruoli', autorizzazioni: ['R', 'W'] },
      { servizio: 'Pagamenti', autorizzazioni: ['R', 'W'] },
      { servizio: 'Pendenze', autorizzazioni: ['R', 'W'] },
      { servizio: 'Rendicontazioni e Incassi', autorizzazioni: ['R', 'W'] },
      { servizio: 'Giornale degli Eventi', autorizzazioni: ['R', 'W'] },
      { servizio: 'Configurazione e manutenzione', autorizzazioni: ['R', 'W'] },
    ],
    autenticazione: 'BASIC',
  };

  it('deriva tutte le ACL boolean dall\'array dei servizi', () => {
    const user = mapProfileToUser(demoResponse, 'mario.rossi');
    expect(user.id).toBe('mario.rossi');
    expect(user.username).toBe('mario.rossi');
    expect(user.displayName).toBe('Mario Rossi');
    expect(user.autenticazione).toBe('BASIC');
    const a = user.acl!;
    expect(a.hasPagoPA).toBe(true);
    expect(a.hasCreditore).toBe(true);
    expect(a.hasConfig).toBe(true); // alias di hasCreditore
    expect(a.hasApplicazioni).toBe(true);
    expect(a.hasRuoli).toBe(true);
    expect(a.hasPagamenti).toBe(true);
    expect(a.hasPendenze).toBe(true);
    expect(a.hasPagamentiePendenze).toBe(true);
    expect(a.hasRendiIncassi).toBe(true);
    expect(a.hasGdE).toBe(true);
    expect(a.hasSetting).toBe(true);
    expect(a.hasTuttiDomini).toBe(true);
    expect(a.hasTuttiTipiPendenza).toBe(true);
    expect(a.hasScrittura).toBe(true);
  });

  it('servizi senza R non concedono la flag (W non è sufficiente per leggere)', () => {
    const user = mapProfileToUser(
      {
        nome: 'X',
        acl: [{ servizio: 'Pagamenti', autorizzazioni: ['W'] }],
      },
      'x',
    );
    expect(user.acl?.hasPagamenti).toBe(false);
    // W presente almeno una volta
    expect(user.acl?.hasScrittura).toBe(true);
  });

  it('mantiene domini e tipiPendenza grezzi e segnala scope ristretto se non c\'è "*"', () => {
    const user = mapProfileToUser(
      {
        nome: 'Y',
        domini: [{ idDominio: 'COM-001' }, { idDominio: 'COM-002' }],
        tipiPendenza: [{ idTipoPendenza: 'TARI' }],
      },
      'y',
    );
    expect(user.domini).toHaveLength(2);
    expect(user.tipiPendenza).toHaveLength(1);
    expect(user.acl?.hasTuttiDomini).toBe(false);
    expect(user.acl?.hasTuttiTipiPendenza).toBe(false);
  });

  it('hasPagamentiePendenze richiede entrambe le ACL', () => {
    const user = mapProfileToUser(
      {
        nome: 'Z',
        acl: [{ servizio: 'Pagamenti', autorizzazioni: ['R'] }],
      },
      'z',
    );
    expect(user.acl?.hasPagamenti).toBe(true);
    expect(user.acl?.hasPendenze).toBe(false);
    expect(user.acl?.hasPagamentiePendenze).toBe(false);
  });
});
