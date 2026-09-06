/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injector } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { SystemFacade } from './system.facade';

// `SystemFacade` ora usa `inject(BREADCRUMB_ICON_RESOLVER, { optional: true })`
// come field initializer (vedi system.facade.ts) — serve un injection
// context, non basta `new SystemFacade()`.
function createFacade(): SystemFacade {
  return Injector.create({ providers: [SystemFacade] }).get(SystemFacade);
}

describe('SystemFacade', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggleSidebar inverte lo stato e persiste', () => {
    const f = createFacade();
    expect(f.sidebarCollapsed()).toBe(false);
    f.toggleSidebar();
    expect(f.sidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('lnk-sidebar-collapsed-default')).toBe('1');
    f.toggleSidebar();
    expect(localStorage.getItem('lnk-sidebar-collapsed-default')).toBe('0');
  });

  it('breadcrumbs si aggiornano', () => {
    const f = createFacade();
    expect(f.breadcrumbs()).toEqual([]);
    f.setBreadcrumbs([{ label: 'A' }, { label: 'B' }]);
    expect(f.breadcrumbs()).toHaveLength(2);
  });

  it('contatore loading non scende sotto zero', () => {
    const f = createFacade();
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
    const f = createFacade();
    expect(f.mobileMenuOpen()).toBe(false);
    f.toggleMobileMenu();
    expect(f.mobileMenuOpen()).toBe(true);
    f.closeMobileMenu();
    expect(f.mobileMenuOpen()).toBe(false);
  });
});
