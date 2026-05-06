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

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import type {
  AppConfig,
  BrandingConfig,
  LayoutConfig,
  RuntimeConfig,
} from './app-config.model';
import { SystemFacade } from '../system/system.facade';
import { LayoutOverridesService } from '../system/layout-overrides.service';
import { ThemeLoaderService } from './theme-loader.service';

const THEME_URL = 'assets/config/theme.json';

/**
 * Headers che disabilitano la cache HTTP per i file di configurazione.
 * Necessario perché in dev `ng serve` può servire la copia cached del config
 * dopo un cambio in `app-config.json` (e l'app prenderebbe il path API vecchio).
 */
const NO_CACHE_HEADERS = new HttpHeaders({
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
});

/**
 * Servizio di configurazione runtime.
 *
 * Carica due file dal server:
 *   1. `app-config.json` (URL passato a `load()`) → configurazione applicativa.
 *   2. `theme.json` (URL fisso) → branding + tema (colori, font, logo).
 *
 * Il tema viene applicato via `ThemeLoaderService` come CSS variables.
 *
 * Esempio:
 *   ```ts
 *   provideAppInitializer(() => inject(ConfigService).load(environment.configFile));
 *   ```
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly system = inject(SystemFacade);
  private readonly themeLoader = inject(ThemeLoaderService);
  private readonly overrides = inject(LayoutOverridesService);

  private readonly _config = signal<RuntimeConfig | null>(null);
  private readonly _branding = signal<BrandingConfig | null>(null);

  readonly config = this._config.asReadonly();
  readonly branding = this._branding.asReadonly();
  readonly appConfig = computed<AppConfig | null>(() => this._config()?.AppConfig ?? null);
  /**
   * Layout effettivo: merge tra `appConfig().Layout` (config statica da
   * `app-config.json`) e gli override session-level di
   * `LayoutOverridesService` (impostati dal pannello tweaks).
   *
   * I consumer di flag che possono essere overridati a runtime
   * (helpButton, gotoTopButton, language/darkMode position, list/detail
   * maxWidth) devono leggere da qui invece che da `appConfig().Layout`.
   */
  readonly effectiveLayout = computed<LayoutConfig | null>(() => {
    const base = this.appConfig()?.Layout;
    if (!base) return null;
    const o = this.overrides;
    return {
      ...base,
      listMaxWidth: o.listMaxWidth() ?? base.listMaxWidth,
      detailMaxWidth: o.detailMaxWidth() ?? base.detailMaxWidth,
      helpButton: o.helpButton() ?? base.helpButton,
      gotoTopButton: o.gotoTopButton() ?? base.gotoTopButton,
      languageSelectorPosition:
        o.languageSelectorPosition() ?? base.languageSelectorPosition,
      darkModeTogglePosition:
        o.darkModeTogglePosition() ?? base.darkModeTogglePosition,
    };
  });

  constructor() {
    // Riapplica il tema quando cambia il color scheme risolto (light <-> dark)
    // o quando arriva il branding la prima volta.
    effect(() => {
      const branding = this._branding();
      const mode = this.system.resolvedScheme();
      if (branding) this.themeLoader.applyBranding(branding, mode);
    });
    // Pubblica i max-width container come CSS variables su <html>.
    // I template di list/detail leggono `--lnk-list-max-w` e
    // `--lnk-detail-max-w` per centrare il contenuto. Usa `effectiveLayout`
    // così gli override del pannello tweaks si propagano in tempo reale.
    effect(() => {
      const layout = this.effectiveLayout();
      const root = document.documentElement;
      root.style.setProperty('--lnk-list-max-w', layout?.listMaxWidth ?? 'none');
      root.style.setProperty('--lnk-detail-max-w', layout?.detailMaxWidth ?? 'none');
    });
  }

  /**
   * Carica `app-config.json` + `theme.json` e applica branding/tema.
   * Da invocare in `provideAppInitializer()`.
   */
  async load(url: string): Promise<void> {
    // cache-busting: il browser (e talvolta il dev server) tendono a servire il
    // JSON dalla cache disco, ignorando il refresh dell'app. Usiamo un timestamp
    // come query param + headers no-cache.
    const bust = `_=${Date.now()}`;
    const configUrl = url.includes('?') ? `${url}&${bust}` : `${url}?${bust}`;
    const themeUrl = `${THEME_URL}?${bust}`;

    const [config, branding] = await Promise.all([
      firstValueFrom(this.http.get<RuntimeConfig>(configUrl, { headers: NO_CACHE_HEADERS })),
      firstValueFrom(
        this.http
          .get<BrandingConfig>(themeUrl, { headers: NO_CACHE_HEADERS })
          .pipe(catchError(() => of(null)))
      ),
    ]);

    this._config.set(config);
    if (branding) {
      // Il setter triggera l'effect che chiama applyBranding(branding, resolvedScheme).
      this._branding.set(branding);
      if (config.AppConfig.app?.title) {
        document.title = config.AppConfig.app.title;
      }
    }
    this.system.setTenant(this.resolveTenantHint());

    // Log diagnostico: utile per verificare in console quale base API
    // l'app sta effettivamente usando dopo il caricamento della config.
    console.info(
      `[config] loaded from ${url} | API base = ${config.AppConfig.GOVAPI.GOVPAY}`
    );
  }

  /** Reapplica il tema corrente (utile dopo cambi runtime di branding). */
  reapplyTheme(): void {
    const b = this._branding();
    if (b) this.themeLoader.applyBranding(b, this.system.resolvedScheme());
  }

  /**
   * Restituisce un identificatore di tenant da `?tenant=` o sottodominio,
   * usato come namespace per persistenze locali (es. sidebar collapse).
   */
  private resolveTenantHint(): string {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('tenant');
    if (fromQuery) return fromQuery;
    const host = url.hostname;
    const parts = host.split('.');
    if (parts.length >= 3) return parts[0];
    return 'default';
  }
}
