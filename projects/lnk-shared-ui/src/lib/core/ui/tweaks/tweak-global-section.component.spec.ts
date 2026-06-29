/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigService } from '../../config';
import { LayoutOverridesService } from '../../system';
import { TweakGlobalSectionComponent } from './tweak-global-section.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

class FakeConfigService {
  readonly effectiveLayout = signal<Record<string, unknown> | null>({});
  readonly appConfig = signal<Record<string, unknown> | null>({});
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ConfigService, useClass: FakeConfigService },
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
  });
}

describe('TweakGlobalSectionComponent', () => {
  beforeEach(() => setup());

  it('default values quando effectiveLayout è vuoto', () => {
    const fixture = TestBed.createComponent(TweakGlobalSectionComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as Record<string, () => unknown>;

    expect((cmp['listMaxWidth'] as () => string)()).toBe('none');
    expect((cmp['detailMaxWidth'] as () => string)()).toBe('none');
    expect((cmp['helpButton'] as () => boolean)()).toBe(true);
    expect((cmp['gotoTopButton'] as () => boolean)()).toBe(true);
    expect((cmp['languagePosition'] as () => string)()).toBe('header');
    expect((cmp['darkModePosition'] as () => string)()).toBe('header');
  });

  it('onListMaxWidthChange scrive su LayoutOverridesService.listMaxWidth', () => {
    const fixture = TestBed.createComponent(TweakGlobalSectionComponent);
    const overrides = TestBed.inject(LayoutOverridesService);
    fixture.componentInstance.onListMaxWidthChange('80rem');
    expect(overrides.listMaxWidth()).toBe('80rem');
  });

  it('onHelpButtonChange + onGotoTopButtonChange scrivono boolean', () => {
    const fixture = TestBed.createComponent(TweakGlobalSectionComponent);
    const overrides = TestBed.inject(LayoutOverridesService);

    fixture.componentInstance.onHelpButtonChange(false);
    fixture.componentInstance.onGotoTopButtonChange(false);

    expect(overrides.helpButton()).toBe(false);
    expect(overrides.gotoTopButton()).toBe(false);
  });

  it('onLanguagePositionChange / onDarkModePositionChange castano a ControlPosition', () => {
    const fixture = TestBed.createComponent(TweakGlobalSectionComponent);
    const overrides = TestBed.inject(LayoutOverridesService);

    fixture.componentInstance.onLanguagePositionChange('sidebar');
    fixture.componentInstance.onDarkModePositionChange('none');

    expect(overrides.languageSelectorPosition()).toBe('sidebar');
    expect(overrides.darkModeTogglePosition()).toBe('none');
  });

  it('resetGlobals chiama overrides.reset()', () => {
    const fixture = TestBed.createComponent(TweakGlobalSectionComponent);
    const overrides = TestBed.inject(LayoutOverridesService);

    overrides.listMaxWidth.set('80rem');
    overrides.helpButton.set(false);
    expect(overrides.hasAnyOverride()).toBe(true);

    fixture.componentInstance.resetGlobals();
    expect(overrides.hasAnyOverride()).toBe(false);
  });

  it('helpButton/gotoTopButton: layout con valore false rispettato', () => {
    const fixture = TestBed.createComponent(TweakGlobalSectionComponent);
    const config = TestBed.inject(ConfigService) as unknown as FakeConfigService;

    config.effectiveLayout.set({ helpButton: false, gotoTopButton: false });

    const cmp = fixture.componentInstance as unknown as Record<string, () => boolean>;
    expect(cmp['helpButton']()).toBe(false);
    expect(cmp['gotoTopButton']()).toBe(false);
  });
});
