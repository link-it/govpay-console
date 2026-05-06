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

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  INITIAL_AUTH_STATE,
  SERVIZIO_ACL,
  mapProfileToUser,
  type AuthState,
  type AuthUser,
  type ProfiloResponse,
} from '../models/auth.model';
import type { AuthMode } from '../../config/app-config.model';
import { ConfigService } from '@core/config';
import { AuthApi } from './auth.api';

const AUTH_STORAGE_KEY = 'lnk-auth';

interface PersistedAuth {
  mode: AuthMode;
  basicCredentials?: string;
  oauth2Token?: string;
}

/**
 * Servizio di autenticazione signal-based.
 * - Persiste su localStorage le credenziali per la sessione (Basic encoded / OAuth2 token).
 * - `loginBasic()` → chiamata API + setUser.
 * - `startRedirectLogin()` → redirect verso endpoint SPID/IAM/OAuth2.
 * - `logout()` → API logout + clear + redirect post-logout.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly config = inject(ConfigService);

  private readonly _state = signal<AuthState>(INITIAL_AUTH_STATE);
  /** True dopo il primo tentativo di rehydration (riuscito o no), così
   *  il guard sa che non serve provare di nuovo. */
  private readonly _rehydrated = signal(false);
  /** Promise singleton del tentativo in corso (anti race-condition). */
  private rehydrating: Promise<boolean> | null = null;

  readonly state = this._state.asReadonly();
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().user !== null);
  readonly mode = computed(() => this._state().mode);
  readonly token = computed(() => this._state().token);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly rehydrated = this._rehydrated.asReadonly();

  constructor() {
    this.restorePersisted();
  }

  /**
   * Verifica/recupera la sessione corrente. Usata dal guard prima di
   * decidere se reindirizzare a login. Riallinea il flusso al legacy
   * `govpay-console-github` (vedi `dashboard-view.component.ts:64` →
   * `isAuthenticated(URL_PROFILO)` su prima entry-page).
   *
   * - Se l'utente è già caricato → `true`.
   * - Se è già stato fatto un tentativo (riuscito o no) → restituisce
   *   l'esito corrente.
   * - Altrimenti chiama `GET /profilo`: se risponde 200, popola `user`;
   *   se 401/altro, pulisce lo stato.
   */
  async ensureSession(): Promise<boolean> {
    if (this.isAuthenticated()) return true;
    if (this._rehydrated()) return false;
    if (!this.rehydrating) {
      this.rehydrating = this.tryRehydrate();
    }
    return this.rehydrating;
  }

  private async tryRehydrate(): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.api.getProfile());
      this._state.update((s) => ({ ...s, user, error: null }));
      this._rehydrated.set(true);
      return true;
    } catch {
      // Sessione assente/scaduta: pulisci eventuali credenziali persistite
      // ma marca rehydrated=true per evitare loop di richieste su ogni nav.
      this._state.set(INITIAL_AUTH_STATE);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      this._rehydrated.set(true);
      return false;
    } finally {
      this.rehydrating = null;
    }
  }

  /**
   * Login finto per test UI: imposta uno user fittizio con tutte le ACL R/W,
   * senza chiamare il backend. Da invocare SOLO in dev (la pagina login espone
   * il pulsante solo se `!environment.production`).
   *
   * Costruisce una `ProfiloResponse` realistica e la passa per il mapper
   * `mapProfileToUser`, così il modello dell'utente è identico al caso reale.
   */
  mockLogin(overrides: Partial<AuthUser> = {}): AuthUser {
    const profilo: ProfiloResponse = {
      nome: 'Mario Rossi',
      principal: 'mario.rossi',
      email: 'mario.rossi@example.org',
      domini: [{ idDominio: '*', ragioneSociale: 'Tutti' }],
      tipiPendenza: [{ idTipoPendenza: '*', descrizione: 'Tutti', pagaTerzi: false, abilitato: true }],
      acl: Object.values(SERVIZIO_ACL).map((servizio) => ({ servizio, autorizzazioni: ['R', 'W'] })),
      autenticazione: 'BASIC',
    };
    const user: AuthUser = { ...mapProfileToUser(profilo), ...overrides };
    this._state.set({
      mode: 'Basic',
      user,
      token: 'mock-token',
      loading: false,
      error: null,
    });
    this.persist({ mode: 'Basic', basicCredentials: 'mock-token' });
    return user;
  }

  /**
   * Effettua login Basic: chiama `/profilo` con header `Authorization: Basic`.
   * In caso di successo persiste le credenziali e popola lo stato.
   */
  async loginBasic(username: string, password: string): Promise<AuthUser> {
    this.setLoading(true);
    this.setError(null);
    try {
      const credentials = btoa(`${username}:${password}`);
      const user = await firstValueFrom(this.api.loginBasic(username, password));
      this._state.set({
        ...this._state(),
        user,
        mode: 'Basic',
        token: credentials,
        error: null,
        loading: false,
      });
      this.persist({ mode: 'Basic', basicCredentials: credentials });
      return user;
    } catch (err) {
      this.setError(this.extractError(err));
      this.setLoading(false);
      throw err;
    }
  }

  /**
   * Avvia un login per redirect (SPID / IAM / OAuth2). Redirige il browser
   * all'endpoint configurato in `AppConfig.Auth.Endpoints[mode]` aggiungendo
   * `returnUrl` come query param.
   */
  startRedirectLogin(mode: 'Spid' | 'Iam' | 'OAuth2', returnUrl: string): void {
    const endpoints = this.config.appConfig()?.Auth.Endpoints;
    if (!endpoints) return;
    const base = this.config.appConfig()?.GOVAPI.GOVPAY ?? '';
    const endpointKey = mode.toLowerCase() as 'spid' | 'iam' | 'oauth2';
    const endpoint = endpoints[endpointKey];
    if (!endpoint) return;
    const url = new URL(`${base}${endpoint}`, window.location.origin);
    url.searchParams.set('returnUrl', returnUrl);
    window.location.href = url.toString();
  }

  /**
   * Logout: chiama l'endpoint API, pulisce lo stato e redirige.
   */
  async logout(): Promise<void> {
    try {
      const resp = await firstValueFrom(this.api.logout());
      this.clear();
      if (resp?.logoutUrl) {
        window.location.href = resp.logoutUrl;
      }
    } catch {
      this.clear();
    }
  }

  setUser(user: AuthUser, mode: AuthMode, token: string | null = null): void {
    this._state.set({ ...this._state(), user, mode, token, error: null });
  }

  clear(): void {
    this._state.set(INITIAL_AUTH_STATE);
    // Logout esplicito: marchiamo rehydrated=true così la guard non
    // tenta una nuova `GET /profilo` (ce ne sarebbe il rifiuto).
    this._rehydrated.set(true);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  setLoading(loading: boolean): void {
    this._state.update((s) => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    this._state.update((s) => ({ ...s, error }));
  }

  /** Header `Authorization` da iniettare via interceptor (Basic / Bearer). */
  authorizationHeader(): string | null {
    const m = this.mode();
    const t = this.token();
    if (!t) return null;
    if (m === 'Basic') return `Basic ${t}`;
    if (m === 'OAuth2') return `Bearer ${t}`;
    return null;
  }

  private persist(data: PersistedAuth): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  private restorePersisted(): void {
    let persisted: PersistedAuth | null = null;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) persisted = JSON.parse(raw) as PersistedAuth;
    } catch {
      persisted = null;
    }
    if (!persisted) return;
    this._state.set({
      ...this._state(),
      mode: persisted.mode,
      token: persisted.basicCredentials ?? persisted.oauth2Token ?? null,
    });
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object') {
      const e = err as { status?: number; error?: { descrizione?: string } };
      if (e.status === 401) return 'Credenziali non valide.';
      if (e.error?.descrizione) return e.error.descrizione;
    }
    return 'Errore durante l’autenticazione.';
  }
}
