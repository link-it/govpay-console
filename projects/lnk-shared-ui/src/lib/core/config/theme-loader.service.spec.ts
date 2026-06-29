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
import type { BrandingConfig } from './app-config.model';

function makeService(): ThemeLoaderService {
  const injector = Injector.create({
    providers: [
      { provide: DOCUMENT, useValue: document },
      { provide: ThemeLoaderService, useFactory: () => new ThemeLoaderService() },
    ],
  });
  return runInInjectionContext(injector, () => injector.get(ThemeLoaderService));
}

describe('ThemeLoaderService', () => {
  it('applica primary/secondary e tutte le variabili del tema', () => {
    const svc = makeService();
    const branding: BrandingConfig = {
      logo: { full: '', compact: '' },
      primaryColor: '#111111',
      secondaryColor: '#222222',
      theme: {
        topBar: { background: '#aa0000', text: '#fff', border: '#ddd', height: '4rem' },
        header: { background: '#bb0000', text: '#000', border: '#eee', showShadow: true },
        sidebar: {
          background: '#cc0000',
          border: '#fff',
          text: '#000',
          textSecondary: '#999',
          itemHover: '#f1f5f9',
          itemActive: '#e0e7ff',
          itemActiveText: '#1f6feb',
          footerBackground: '#fff',
          footerBorder: '#eee',
        },
        content: {
          background: '#f8fafc',
          text: '#000',
          cardBackground: '#fff',
          cardBorder: '#e5e7eb',
          cardHover: '#f8fafc',
          muted: '#f1f5f9',
          mutedForeground: '#64748b',
        },
        buttons: {
          primaryBackground: '#111',
          primaryText: '#fff',
          primaryHover: '#000',
          secondaryBackground: '#fff',
          secondaryText: '#000',
          secondaryBorder: '#eee',
          secondaryHover: '#f3f4f6',
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',
        info: '#0284c7',
      },
    };

    svc.applyBranding(branding);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('#111111');
    expect(root.style.getPropertyValue('--secondary')).toBe('#222222');
    expect(root.style.getPropertyValue('--topbar-bg')).toBe('#aa0000');
    expect(root.style.getPropertyValue('--header-bg')).toBe('#bb0000');
    expect(root.style.getPropertyValue('--sidebar-bg')).toBe('#cc0000');
    expect(root.style.getPropertyValue('--header-shadow')).not.toBe('none');
    expect(root.style.getPropertyValue('--btn-primary-bg')).toBe('#111');
    expect(root.style.getPropertyValue('--success')).toBe('#16a34a');
  });
});
