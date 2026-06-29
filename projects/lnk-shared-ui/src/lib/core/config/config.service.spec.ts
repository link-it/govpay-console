/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from './config.service';
import { ThemeLoaderService } from './theme-loader.service';
import { LayoutOverridesService } from '../system/layout-overrides.service';
import type { RuntimeConfig, BrandingConfig } from './app-config.model';

class FakeHttpClient {
  responses: Record<string, unknown> = {};
  get(url: string) {
    // match per pathname (ignora cache-bust query string)
    const base = url.split('?')[0];
    const r = this.responses[base];
    if (r === undefined) throw new Error(`No mock for ${base}`);
    return of(r);
  }
}

function setup(http: FakeHttpClient) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: HttpClient, useValue: http },
    ],
  });
}

afterEach(() => {
  document.documentElement.style.removeProperty('--lnk-list-max-w');
  document.documentElement.style.removeProperty('--lnk-detail-max-w');
});

const RUNTIME: RuntimeConfig = {
  AppConfig: {
    GOVAPI: { GOVPAY: '/govpay-api-backoffice/rs/form/v1' },
    Layout: {
      listMaxWidth: '80rem',
      detailMaxWidth: '64rem',
      helpButton: true,
    },
  } as unknown as RuntimeConfig['AppConfig'],
};

const BRANDING: BrandingConfig = {
  logo: { full: '/logo.svg', compact: '/c.svg' },
  primaryColor: '#ff4050',
} as BrandingConfig;

describe('ConfigService', () => {
  let http: FakeHttpClient;

  beforeEach(() => {
    http = new FakeHttpClient();
    setup(http);
  });

  it("appConfig: null se config non caricata", () => {
    const svc = TestBed.inject(ConfigService);
    expect(svc.appConfig()).toBeNull();
  });

  it("appConfig + branding popolati dopo load()", async () => {
    http.responses['app-config.json'] = RUNTIME;
    http.responses['assets/config/theme.json'] = BRANDING;
    const svc = TestBed.inject(ConfigService);

    await svc.load('app-config.json');

    expect(svc.appConfig()).toBeTruthy();
    expect(svc.appConfig()?.GOVAPI.GOVPAY).toBe('/govpay-api-backoffice/rs/form/v1');
    expect(svc.branding()).toEqual(BRANDING);
  });

  it("effectiveLayout: ritorna null se non c'è appConfig", () => {
    const svc = TestBed.inject(ConfigService);
    expect(svc.effectiveLayout()).toBeNull();
  });

  it("effectiveLayout: usa i valori base quando overrides null", async () => {
    http.responses['app-config.json'] = RUNTIME;
    http.responses['assets/config/theme.json'] = BRANDING;
    const svc = TestBed.inject(ConfigService);
    await svc.load('app-config.json');

    const layout = svc.effectiveLayout();
    expect(layout?.listMaxWidth).toBe('80rem');
    expect(layout?.detailMaxWidth).toBe('64rem');
    expect(layout?.helpButton).toBe(true);
  });

  it("effectiveLayout: gli override hanno priorità sulla config base", async () => {
    http.responses['app-config.json'] = RUNTIME;
    http.responses['assets/config/theme.json'] = BRANDING;
    const svc = TestBed.inject(ConfigService);
    const overrides = TestBed.inject(LayoutOverridesService);
    await svc.load('app-config.json');

    overrides.listMaxWidth.set('120rem');
    overrides.helpButton.set(false);

    const layout = svc.effectiveLayout();
    expect(layout?.listMaxWidth).toBe('120rem');
    expect(layout?.helpButton).toBe(false);
    // Quelli non overrided restano dalla config base
    expect(layout?.detailMaxWidth).toBe('64rem');
  });

  it("effect publica --lnk-list-max-w e --lnk-detail-max-w su <html>", async () => {
    http.responses['app-config.json'] = RUNTIME;
    http.responses['assets/config/theme.json'] = BRANDING;
    TestBed.inject(ConfigService); // triggera l'effect dell'init (con appConfig=null → 'none')
    // Inject + load → l'effect pubblica i valori effettivi
    const svc = TestBed.inject(ConfigService);
    await svc.load('app-config.json');
    // Lasciamo che l'effect sincronizzi via flushEffects su detectChanges via inject
    TestBed.flushEffects?.();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--lnk-list-max-w')).toBe('80rem');
    expect(root.style.getPropertyValue('--lnk-detail-max-w')).toBe('64rem');
  });

  it("reapplyTheme(): chiama themeLoader.applyBranding con il branding corrente", async () => {
    http.responses['app-config.json'] = RUNTIME;
    http.responses['assets/config/theme.json'] = BRANDING;
    const svc = TestBed.inject(ConfigService);
    await svc.load('app-config.json');

    const themeLoader = TestBed.inject(ThemeLoaderService);
    const spy = vi.spyOn(themeLoader, 'applyBranding');

    svc.reapplyTheme();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(BRANDING);
  });

  it("reapplyTheme(): no-op se branding non e` ancora stato caricato", () => {
    const svc = TestBed.inject(ConfigService);
    const themeLoader = TestBed.inject(ThemeLoaderService);
    const spy = vi.spyOn(themeLoader, 'applyBranding');
    svc.reapplyTheme();
    expect(spy).not.toHaveBeenCalled();
  });

  it("load(): branding null (theme.json non disponibile) non fa esplodere", async () => {
    http.responses['app-config.json'] = RUNTIME;
    http.responses['assets/config/theme.json'] = null; // simula 404 catchato
    const svc = TestBed.inject(ConfigService);
    await svc.load('app-config.json');

    expect(svc.appConfig()).toBeTruthy();
    expect(svc.branding()).toBeNull();
  });
});
