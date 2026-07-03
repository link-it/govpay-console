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

import { OverlayModule } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '../../config';
import { LayoutOverridesService } from '../../system';
import { GlobalTweaksHostComponent } from './global-tweaks-host.component';
import { TweaksRegistry } from './tweaks-registry.service';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

class FakeConfigService {
  readonly appConfig = signal<Record<string, unknown> | null>({ Layout: {} });
  readonly effectiveLayout = signal<Record<string, unknown> | null>({});
  readonly themes = signal<unknown[]>([]);
  readonly activeThemeId = signal('');
  readonly themeOverridden = signal(false);
  selectTheme(): Promise<void> {
    return Promise.resolve();
  }
  resetTheme(): Promise<void> {
    return Promise.resolve();
  }
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [OverlayModule],
    providers: [
      { provide: ConfigService, useClass: FakeConfigService },
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
  });
}

describe('GlobalTweaksHostComponent', () => {
  beforeEach(() => setup());

  it("fabVisible: true se Layout.tweaksPanel diverso da false", () => {
    const fixture = TestBed.createComponent(GlobalTweaksHostComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as Record<string, () => boolean>;
    expect(cmp['fabVisible']()).toBe(true);
  });

  it("fabVisible: false se Layout.tweaksPanel = false", () => {
    const fixture = TestBed.createComponent(GlobalTweaksHostComponent);
    const config = TestBed.inject(ConfigService) as unknown as FakeConfigService;
    config.appConfig.set({ Layout: { tweaksPanel: false } });
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as Record<string, () => boolean>;
    expect(cmp['fabVisible']()).toBe(false);
  });

  it("hasReset: false con zero override e zero sezioni", () => {
    const fixture = TestBed.createComponent(GlobalTweaksHostComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as Record<string, () => boolean>;
    expect(cmp['hasReset']()).toBe(false);
  });

  it("hasReset: true se LayoutOverridesService ha almeno un override", () => {
    const fixture = TestBed.createComponent(GlobalTweaksHostComponent);
    const overrides = TestBed.inject(LayoutOverridesService);
    overrides.helpButton.set(false);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as Record<string, () => boolean>;
    expect(cmp['hasReset']()).toBe(true);
  });

  it("hasReset: true se TweaksRegistry ha almeno una sezione registrata", () => {
    const fixture = TestBed.createComponent(GlobalTweaksHostComponent);
    const registry = TestBed.inject(TweaksRegistry);
    registry.register({
      id: 's1',
      titleKey: 'T',
      rows: [],
    });
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as Record<string, () => boolean>;
    expect(cmp['hasReset']()).toBe(true);
  });

  it("onReset combina overrides.reset() + registry.resetAll()", () => {
    const fixture = TestBed.createComponent(GlobalTweaksHostComponent);
    const overrides = TestBed.inject(LayoutOverridesService);
    const registry = TestBed.inject(TweaksRegistry);

    overrides.listMaxWidth.set('80rem');
    const resetSpy = vi.fn();
    registry.register({
      id: 'pendenze',
      titleKey: 'T',
      rows: [],
      onReset: resetSpy,
    });

    const cmp = fixture.componentInstance as unknown as Record<string, () => void>;
    cmp['onReset']();

    expect(overrides.listMaxWidth()).toBeNull();
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
