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

import { Injectable, computed, signal } from '@angular/core';
import type { ColorScheme, ResolvedColorScheme } from '../config/app-config.model';
import { iconForNavLabel } from '../layout/nav';

const SIDEBAR_KEY_PREFIX = 'lnk-sidebar-collapsed';
const COLOR_SCHEME_KEY = 'lnk-color-scheme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export interface BreadcrumbItem {
  /** Chiave i18n o testo letterale visualizzato nel breadcrumb. */
  label: string;
  /** Rotta interna; se assente la voce non è cliccabile. */
  url?: string;
  /** Query params opzionali da applicare al routerLink (es. `{ tab: 'eventi' }`). */
  queryParams?: Record<string, string>;
  /**
   * Nome icona registrato in `APP_ICONS` (es. `'bootstrapBank'`).
   * Mostrata accanto al label dal breadcrumb dell'header.
   */
  icon?: string;
}

/**
 * Stato applicativo globale (signal-based, no NgRx).
 *
 * Gestisce:
 *   - sidebar collapsed (persistito per tenant)
 *   - mobile menu / breadcrumb / contatore loading / help sidebar
 *   - color scheme (light / dark / auto): persistito in `lnk-color-scheme`,
 *     `auto` segue `prefers-color-scheme` del sistema
 */
@Injectable({ providedIn: 'root' })
export class SystemFacade {
  private tenantKey = 'default';
  private readonly _sidebarCollapsed = signal(this.loadCollapsed('default'));
  private readonly _mobileMenuOpen = signal(false);
  private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);
  private readonly _loadingCount = signal(0);
  private readonly _helpOpen = signal(false);
  private readonly _helpContext = signal<{ context: string; section?: string } | null>(null);

  private readonly _colorScheme = signal<ColorScheme>(this.loadColorScheme());
  private readonly _systemDark = signal<boolean>(this.detectSystemDark());

  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();
  readonly mobileMenuOpen = this._mobileMenuOpen.asReadonly();
  readonly breadcrumbs = this._breadcrumbs.asReadonly();
  readonly loading = computed(() => this._loadingCount() > 0);
  readonly helpOpen = this._helpOpen.asReadonly();
  readonly helpContext = this._helpContext.asReadonly();

  /** Modalità scelta dall'utente: 'light' | 'dark' | 'auto'. */
  readonly colorScheme = this._colorScheme.asReadonly();
  /** Modalità effettiva (auto → light|dark in base al sistema). */
  readonly resolvedScheme = computed<ResolvedColorScheme>(() => {
    const c = this._colorScheme();
    if (c === 'auto') return this._systemDark() ? 'dark' : 'light';
    return c;
  });

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mql = window.matchMedia(DARK_QUERY);
      const handler = (e: MediaQueryListEvent) => this._systemDark.set(e.matches);
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
      } else if (typeof (mql as MediaQueryList & { addListener?: (h: (e: MediaQueryListEvent) => void) => void }).addListener === 'function') {
        (mql as MediaQueryList & { addListener: (h: (e: MediaQueryListEvent) => void) => void }).addListener(handler);
      }
    }
  }

  /**
   * Aggiorna il tenant corrente: la chiave di persistenza della sidebar diventa
   * `lnk-sidebar-collapsed-{tenant}`. Va chiamato da `ConfigService.applyTenant()`.
   */
  setTenant(tenant: string): void {
    if (this.tenantKey === tenant) return;
    this.tenantKey = tenant;
    this._sidebarCollapsed.set(this.loadCollapsed(tenant));
  }

  toggleSidebar(): void {
    this._sidebarCollapsed.update((v) => !v);
    this.persistCollapsed(this._sidebarCollapsed());
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
    this.persistCollapsed(collapsed);
  }

  toggleMobileMenu(): void {
    this._mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this._mobileMenuOpen.set(false);
  }

  setBreadcrumbs(items: BreadcrumbItem[]): void {
    // Auto-arricchimento icona: se l'item non specifica `icon` e la sua
    // `label` corrisponde a una voce di nav, prendiamo l'icona da lì.
    // In questo modo le singole feature non devono ripetere il binding
    // dell'icona in ogni `setBreadcrumbs`.
    const enriched = items.map((it) => (it.icon ? it : { ...it, icon: iconForNavLabel(it.label) }));
    this._breadcrumbs.set(enriched);
  }

  startLoading(): void {
    this._loadingCount.update((c) => c + 1);
  }

  stopLoading(): void {
    this._loadingCount.update((c) => Math.max(0, c - 1));
  }

  openHelp(context: string, section?: string): void {
    this._helpContext.set({ context, section });
    this._helpOpen.set(true);
  }

  closeHelp(): void {
    this._helpOpen.set(false);
  }

  /**
   * Imposta la modalità colore. La persistenza è globale (non per tenant) — è una
   * preferenza utente che vogliamo seguire ovunque.
   */
  setColorScheme(scheme: ColorScheme): void {
    this._colorScheme.set(scheme);
    try {
      localStorage.setItem(COLOR_SCHEME_KEY, scheme);
    } catch {
      /* ignore */
    }
  }

  /** Cicla light → dark → auto → light. */
  cycleColorScheme(): ColorScheme {
    const next: ColorScheme =
      this._colorScheme() === 'light' ? 'dark' : this._colorScheme() === 'dark' ? 'auto' : 'light';
    this.setColorScheme(next);
    return next;
  }

  private storageKey(tenant: string): string {
    return `${SIDEBAR_KEY_PREFIX}-${tenant}`;
  }

  private loadCollapsed(tenant: string): boolean {
    try {
      return localStorage.getItem(this.storageKey(tenant)) === '1';
    } catch {
      return false;
    }
  }

  private persistCollapsed(collapsed: boolean): void {
    try {
      localStorage.setItem(this.storageKey(this.tenantKey), collapsed ? '1' : '0');
    } catch {
      /* localStorage non disponibile */
    }
  }

  private loadColorScheme(): ColorScheme {
    try {
      const v = localStorage.getItem(COLOR_SCHEME_KEY);
      if (v === 'light' || v === 'dark' || v === 'auto') return v;
    } catch {
      /* ignore */
    }
    return 'auto';
  }

  private detectSystemDark(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(DARK_QUERY).matches;
  }
}
