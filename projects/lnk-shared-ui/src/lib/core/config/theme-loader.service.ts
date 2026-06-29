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

import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { BrandingConfig, ThemeConfig, ThemeTabsConfig } from './app-config.model';

/**
 * Applica le variabili CSS del tema al `document.documentElement`.
 *
 * Supporta light/dark mode:
 *   - `applyBranding(branding, 'light')` applica i valori base.
 *   - `applyBranding(branding, 'dark')` applica i valori base + sovrascrive con
 *     `theme.dark` (shallow merge sui sotto-oggetti topBar/header/sidebar/...).
 *
 * Inoltre aggiunge/rimuove la classe `.dark` su `<html>` per supportare le
 * utilities `dark:*` di Tailwind se servono.
 */
@Injectable({ providedIn: 'root' })
export class ThemeLoaderService {
  private readonly document = inject(DOCUMENT);
  private fontLinkEl: HTMLLinkElement | null = null;

  applyBranding(branding: BrandingConfig, mode: 'light' | 'dark' = 'light'): void {
    const root = this.document.documentElement;
    root.style.setProperty('--primary', branding.primaryColor);
    root.style.setProperty('--secondary', branding.secondaryColor);
    if (branding.theme) this.applyTheme(branding.theme, mode);
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  applyTheme(theme: ThemeConfig, mode: 'light' | 'dark' = 'light'): void {
    const root = this.document.documentElement;
    const merged = mode === 'dark' && theme.dark ? this.mergeDark(theme, theme.dark) : theme;

    // Top bar
    root.style.setProperty('--topbar-bg', merged.topBar.background);
    root.style.setProperty('--topbar-text', merged.topBar.text);
    root.style.setProperty('--topbar-border', merged.topBar.border);
    if (merged.topBar.height) root.style.setProperty('--topbar-height', merged.topBar.height);

    // Header
    root.style.setProperty('--header-bg', merged.header.background);
    root.style.setProperty('--header-text', merged.header.text);
    root.style.setProperty('--header-border', merged.header.border);
    root.style.setProperty(
      '--header-shadow',
      merged.header.showShadow ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
    );

    // Sidebar
    root.style.setProperty('--sidebar-bg', merged.sidebar.background);
    root.style.setProperty('--sidebar-border', merged.sidebar.border);
    root.style.setProperty('--sidebar-text', merged.sidebar.text);
    root.style.setProperty('--sidebar-text-secondary', merged.sidebar.textSecondary);
    root.style.setProperty('--sidebar-item-hover', merged.sidebar.itemHover);
    root.style.setProperty('--sidebar-item-active', merged.sidebar.itemActive);
    root.style.setProperty('--sidebar-item-active-text', merged.sidebar.itemActiveText);
    root.style.setProperty('--sidebar-footer-bg', merged.sidebar.footerBackground);
    root.style.setProperty('--sidebar-footer-border', merged.sidebar.footerBorder);

    // Content
    root.style.setProperty('--background', merged.content.background);
    root.style.setProperty('--foreground', merged.content.text);
    root.style.setProperty('--card-bg', merged.content.cardBackground);
    root.style.setProperty('--card-border', merged.content.cardBorder);
    root.style.setProperty('--card-hover', merged.content.cardHover);
    root.style.setProperty('--muted', merged.content.muted);
    root.style.setProperty('--muted-foreground', merged.content.mutedForeground);
    root.style.setProperty('--border', merged.content.cardBorder);

    // Buttons
    root.style.setProperty('--btn-primary-bg', merged.buttons.primaryBackground);
    root.style.setProperty('--btn-primary-text', merged.buttons.primaryText);
    root.style.setProperty('--btn-primary-hover', merged.buttons.primaryHover);
    root.style.setProperty('--btn-secondary-bg', merged.buttons.secondaryBackground);
    root.style.setProperty('--btn-secondary-text', merged.buttons.secondaryText);
    root.style.setProperty('--btn-secondary-border', merged.buttons.secondaryBorder);
    root.style.setProperty('--btn-secondary-hover', merged.buttons.secondaryHover);

    // Foreground sui colori brand sincronizzati con buttons.primaryText
    root.style.setProperty('--primary-foreground', merged.buttons.primaryText);
    root.style.setProperty('--secondary-foreground', merged.buttons.primaryText);

    // Stati
    if (merged.success) root.style.setProperty('--success', merged.success);
    if (merged.warning) root.style.setProperty('--warning', merged.warning);
    if (merged.danger) root.style.setProperty('--danger', merged.danger);
    if (merged.info) root.style.setProperty('--info', merged.info);

    // Tabs (`<lnk-tabs>`)
    this.applyTabs(merged.tabs);

    // Font (uguale per light/dark, le `fonts` non sono mergiabili da `dark`)
    if (theme.fonts?.primary) {
      root.style.setProperty(
        '--font-sans',
        `"${theme.fonts.primary.family}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`
      );
      if (theme.fonts.primary.url) this.loadFontStylesheet(theme.fonts.primary.url);
    }
  }

  /**
   * Shallow merge dei sotto-oggetti del tema con gli override `dark`.
   * Esposta come metodo per essere unit-testabile.
   */
  mergeDark(base: ThemeConfig, dark: NonNullable<ThemeConfig['dark']>): ThemeConfig {
    return {
      ...base,
      topBar: { ...base.topBar, ...(dark.topBar ?? {}) },
      header: { ...base.header, ...(dark.header ?? {}) },
      sidebar: { ...base.sidebar, ...(dark.sidebar ?? {}) },
      content: { ...base.content, ...(dark.content ?? {}) },
      buttons: { ...base.buttons, ...(dark.buttons ?? {}) },
      tabs: this.mergeTabs(base.tabs, dark.tabs),
      success: dark.success ?? base.success,
      warning: dark.warning ?? base.warning,
      danger: dark.danger ?? base.danger,
      info: dark.info ?? base.info,
    };
  }

  /**
   * Applica gli override `tabs` come CSS variables `--lnk-tabs-*` su `:root`.
   * Le proprietà non valorizzate vengono rimosse, lasciando in vigore i
   * default definiti su `:host` del componente (che ricadono sui token
   * globali del tema).
   */
  private applyTabs(tabs: ThemeTabsConfig | undefined): void {
    const root = this.document.documentElement;
    const set = (name: string, value: string | number | undefined): void => {
      if (value == null || value === '') {
        root.style.removeProperty(name);
      } else {
        root.style.setProperty(name, String(value));
      }
    };

    const s = tabs?.shared;
    set('--lnk-tabs-text', s?.text);
    set('--lnk-tabs-text-hover', s?.textHover);
    set('--lnk-tabs-text-active', s?.textActive);
    set('--lnk-tabs-font-size', s?.fontSize);
    set('--lnk-tabs-font-weight', s?.fontWeight);
    set('--lnk-tabs-font-weight-active', s?.fontWeightActive);
    set('--lnk-tabs-gap', s?.gap);
    set('--lnk-tabs-padding-x', s?.paddingX);
    set('--lnk-tabs-padding-y', s?.paddingY);
    set('--lnk-tabs-focus-ring', s?.focusRing);
    set('--lnk-tabs-badge-bg', s?.badgeBackground);
    set('--lnk-tabs-badge-text', s?.badgeText);

    const u = tabs?.underline;
    set('--lnk-tabs-track-border', u?.trackBorder);
    set('--lnk-tabs-indicator-color', u?.indicatorColor);
    set('--lnk-tabs-indicator-size', u?.indicatorSize);

    const g = tabs?.segmented;
    set('--lnk-tabs-segmented-track-bg', g?.trackBackground);
    set('--lnk-tabs-segmented-track-padding', g?.trackPadding);
    set('--lnk-tabs-segmented-track-radius', g?.trackRadius);
    set('--lnk-tabs-segmented-padding-x', g?.paddingX);
    set('--lnk-tabs-segmented-padding-y', g?.paddingY);
    set('--lnk-tabs-segmented-radius', g?.radius);
    set('--lnk-tabs-segmented-pill-bg', g?.pillBackground);
    set('--lnk-tabs-segmented-pill-text', g?.pillText);
    set('--lnk-tabs-segmented-pill-shadow', g?.pillShadow);
    set('--lnk-tabs-segmented-pill-font-weight', g?.pillFontWeight);
    set('--lnk-tabs-segmented-text-hover', g?.textHover);
    set('--lnk-tabs-segmented-badge-bg', g?.badgeBackground);
    set('--lnk-tabs-segmented-badge-bg-active', g?.badgeBackgroundActive);
    set('--lnk-tabs-segmented-badge-text-active', g?.badgeTextActive);
  }

  /**
   * Shallow merge dei sotto-oggetti `tabs` con i corrispondenti override
   * `tabs.dark`. Se nessuna delle due definizioni contiene la sezione,
   * restituisce `undefined` per saltare l'apply.
   */
  private mergeTabs(
    base: ThemeTabsConfig | undefined,
    dark: ThemeTabsConfig | undefined
  ): ThemeTabsConfig | undefined {
    if (!base && !dark) return undefined;
    return {
      shared: { ...(base?.shared ?? {}), ...(dark?.shared ?? {}) },
      underline: { ...(base?.underline ?? {}), ...(dark?.underline ?? {}) },
      segmented: { ...(base?.segmented ?? {}), ...(dark?.segmented ?? {}) },
    };
  }

  private loadFontStylesheet(url: string): void {
    if (this.fontLinkEl?.href === url) return;
    if (!this.fontLinkEl) {
      this.fontLinkEl = this.document.createElement('link');
      this.fontLinkEl.rel = 'stylesheet';
      this.document.head.appendChild(this.fontLinkEl);
    }
    this.fontLinkEl.href = url;
  }
}
