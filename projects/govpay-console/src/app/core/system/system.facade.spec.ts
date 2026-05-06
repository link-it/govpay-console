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

import { beforeEach, describe, expect, it } from 'vitest';
import { SystemFacade } from './system.facade';

describe('SystemFacade', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggleSidebar inverte lo stato e persiste', () => {
    const f = new SystemFacade();
    expect(f.sidebarCollapsed()).toBe(false);
    f.toggleSidebar();
    expect(f.sidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('lnk-sidebar-collapsed-default')).toBe('1');
    f.toggleSidebar();
    expect(localStorage.getItem('lnk-sidebar-collapsed-default')).toBe('0');
  });

  it('breadcrumbs si aggiornano', () => {
    const f = new SystemFacade();
    expect(f.breadcrumbs()).toEqual([]);
    f.setBreadcrumbs([{ label: 'A' }, { label: 'B' }]);
    expect(f.breadcrumbs()).toHaveLength(2);
  });

  it('contatore loading non scende sotto zero', () => {
    const f = new SystemFacade();
    expect(f.loading()).toBe(false);
    f.startLoading();
    f.startLoading();
    f.stopLoading();
    expect(f.loading()).toBe(true);
    f.stopLoading();
    expect(f.loading()).toBe(false);
    f.stopLoading();
    expect(f.loading()).toBe(false);
  });

  it('mobile menu toggle', () => {
    const f = new SystemFacade();
    expect(f.mobileMenuOpen()).toBe(false);
    f.toggleMobileMenu();
    expect(f.mobileMenuOpen()).toBe(true);
    f.closeMobileMenu();
    expect(f.mobileMenuOpen()).toBe(false);
  });
});
