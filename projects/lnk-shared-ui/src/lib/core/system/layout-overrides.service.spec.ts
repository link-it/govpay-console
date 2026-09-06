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
import { LayoutOverridesService } from './layout-overrides.service';

function createService(): LayoutOverridesService {
  return Injector.create({ providers: [LayoutOverridesService] }).get(LayoutOverridesService);
}

describe('LayoutOverridesService', () => {
  let svc: LayoutOverridesService;

  beforeEach(() => {
    svc = createService();
  });

  it('default: tutti gli override sono null e hasAnyOverride è false', () => {
    expect(svc.listMaxWidth()).toBeNull();
    expect(svc.detailMaxWidth()).toBeNull();
    expect(svc.helpButton()).toBeNull();
    expect(svc.gotoTopButton()).toBeNull();
    expect(svc.languageSelectorPosition()).toBeNull();
    expect(svc.darkModeTogglePosition()).toBeNull();
    expect(svc.hasAnyOverride()).toBe(false);
  });

  it('hasAnyOverride true non appena un override è impostato', () => {
    svc.helpButton.set(false);
    expect(svc.hasAnyOverride()).toBe(true);
  });

  it('hasAnyOverride reagisce a override "falsy" (es. false / stringa vuota)', () => {
    // `false` è un valore di override valido (diverso da null), deve
    // attivare hasAnyOverride.
    svc.gotoTopButton.set(false);
    expect(svc.hasAnyOverride()).toBe(true);

    svc.gotoTopButton.set(null);
    svc.listMaxWidth.set('');
    expect(svc.hasAnyOverride()).toBe(true);
  });

  it('reset() azzera tutti gli override', () => {
    svc.listMaxWidth.set('1200px');
    svc.helpButton.set(true);
    svc.languageSelectorPosition.set('sidebar');
    svc.darkModeTogglePosition.set('none');

    svc.reset();

    expect(svc.listMaxWidth()).toBeNull();
    expect(svc.helpButton()).toBeNull();
    expect(svc.languageSelectorPosition()).toBeNull();
    expect(svc.darkModeTogglePosition()).toBeNull();
    expect(svc.hasAnyOverride()).toBe(false);
  });
});
