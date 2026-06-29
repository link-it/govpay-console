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

import { DOCUMENT, Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { ThemeLoaderService } from './theme-loader.service';
import type { BrandingConfig, ThemeConfig } from './app-config.model';

function makeService(): ThemeLoaderService {
  const injector = Injector.create({
    providers: [
      { provide: DOCUMENT, useValue: document },
      { provide: ThemeLoaderService, useFactory: () => new ThemeLoaderService() },
    ],
  });
  return runInInjectionContext(injector, () => injector.get(ThemeLoaderService));
}

const baseTheme: ThemeConfig = {
  topBar: { background: '#ffffff', text: '#000', border: '#eee' },
  header: { background: '#ffffff', text: '#000', border: '#eee', showShadow: false },
  sidebar: {
    background: '#ffffff',
    border: '#eee',
    text: '#000',
    textSecondary: '#999',
    itemHover: '#f5f5f5',
    itemActive: '#e0e0e0',
    itemActiveText: '#ff4050',
    footerBackground: '#ffffff',
    footerBorder: '#eee',
  },
  content: {
    background: '#fafafa',
    text: '#000',
    cardBackground: '#ffffff',
    cardBorder: '#eee',
    cardHover: '#fafafa',
    muted: '#f5f5f5',
    mutedForeground: '#666',
  },
  buttons: {
    primaryBackground: '#ff4050',
    primaryText: '#ffffff',
    primaryHover: '#e6394a',
    secondaryBackground: '#ffffff',
    secondaryText: '#000',
    secondaryBorder: '#eee',
    secondaryHover: '#f5f5f5',
  },
  dark: {
    sidebar: { background: '#0f172a' } as ThemeConfig['sidebar'],
    content: { background: '#020617' } as ThemeConfig['content'],
    buttons: { secondaryBackground: '#1e293b' } as ThemeConfig['buttons'],
    info: '#38bdf8',
  },
};

describe('ThemeLoaderService — dark mode', () => {
  it('mergeDark fa shallow merge sui sotto-oggetti', () => {
    const svc = makeService();
    const merged = svc.mergeDark(baseTheme, baseTheme.dark!);
    // override applicato
    expect(merged.sidebar.background).toBe('#0f172a');
    // campo non override mantiene il valore base
    expect(merged.sidebar.text).toBe('#000');
    expect(merged.sidebar.itemActiveText).toBe('#ff4050');
    // info override
    expect(merged.info).toBe('#38bdf8');
    // buttons partial: solo secondaryBackground sovrascritto
    expect(merged.buttons.secondaryBackground).toBe('#1e293b');
    expect(merged.buttons.primaryBackground).toBe('#ff4050');
  });

  it('applyBranding(dark) aggiunge la classe `dark` al documentElement e applica gli override', () => {
    const svc = makeService();
    const branding: BrandingConfig = {
      logo: { full: '', compact: '' },
      primaryColor: '#ff4050',
      secondaryColor: '#213349',
      theme: baseTheme,
    };
    svc.applyBranding(branding, 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--sidebar-bg')).toBe('#0f172a');
    expect(document.documentElement.style.getPropertyValue('--background')).toBe('#020617');
  });

  it('applyBranding(light) rimuove la classe `dark` e applica i valori base', () => {
    const svc = makeService();
    document.documentElement.classList.add('dark'); // pre-esistente
    const branding: BrandingConfig = {
      logo: { full: '', compact: '' },
      primaryColor: '#ff4050',
      secondaryColor: '#213349',
      theme: baseTheme,
    };
    svc.applyBranding(branding, 'light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--sidebar-bg')).toBe('#ffffff');
  });
});
