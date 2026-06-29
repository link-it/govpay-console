/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { SystemFacade } from '../../system';
import { ColorSchemeToggleComponent } from './color-scheme-toggle.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
  });
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ColorSchemeToggleComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('ColorSchemeToggleComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    setup();
  });

  it("default 'compact': renderizza solo l'icona (nessuna label visibile)", () => {
    const fixture = render();
    const spans = fixture.nativeElement.querySelectorAll('span');
    // Nella variante compact niente <span class="truncate">{{ labelKey }}</span>
    expect(spans.length).toBe(0);
    expect(fixture.nativeElement.querySelector('ng-icon')).toBeTruthy();
  });

  it("variant 'full': renderizza icona + label", () => {
    const fixture = render({ variant: 'full' });
    expect(fixture.nativeElement.querySelector('span.truncate')).toBeTruthy();
  });

  it('computed icon() riflette lo schema corrente del SystemFacade', () => {
    const fixture = render();
    const system = TestBed.inject(SystemFacade);

    system.setColorScheme('light');
    expect(fixture.componentInstance.icon()).toBe('bootstrapSun');

    system.setColorScheme('dark');
    expect(fixture.componentInstance.icon()).toBe('bootstrapMoon');

    system.setColorScheme('auto');
    expect(fixture.componentInstance.icon()).toBe('bootstrapCircleHalf');
  });

  it('click invoca cycleColorScheme di SystemFacade (light → dark)', () => {
    const fixture = render();
    const system = TestBed.inject(SystemFacade);
    system.setColorScheme('light');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();

    expect(system.colorScheme()).toBe('dark');
  });

  it('aria-label deriva dalla hintKey corrente', () => {
    const fixture = render();
    const system = TestBed.inject(SystemFacade);
    system.setColorScheme('light');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    // Manca traduzione → fallback al raw della key.
    expect(btn.getAttribute('aria-label')).toBe('Theme.CycleHint.Light');
  });
});
