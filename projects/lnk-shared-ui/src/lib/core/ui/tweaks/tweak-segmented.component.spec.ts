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

import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { TweakSegmentedComponent } from './tweak-segmented.component';
import type { TweakSegmentedOption } from './tweaks-types';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

const OPTIONS: TweakSegmentedOption[] = [
  { value: 'table', labelKey: 'Tweaks.View.Table' },
  { value: 'rows', labelKey: 'Tweaks.View.Rows' },
];

function render(value: string, size: 'md' | 'sm' = 'md') {
  const fixture = TestBed.createComponent(TweakSegmentedComponent);
  fixture.componentRef.setInput('options', OPTIONS);
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('size', size);
  fixture.detectChanges();
  return fixture;
}

describe('TweakSegmentedComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });

  it("mappa options in TabDef[] (id=value, labelKey, icon)", () => {
    const fixture = render('table');
    const tabsCmp = fixture.nativeElement.querySelector('lnk-tabs');
    expect(tabsCmp).toBeTruthy();
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]');
    expect(buttons.length).toBe(2);
    expect(buttons[0].id).toBe('tab-table');
    expect(buttons[1].id).toBe('tab-rows');
  });

  it("variant 'segmented' forwarda al wrapper <lnk-tabs>", () => {
    const fixture = render('table');
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.classList).toContain('lnk-tablist--segmented');
  });

  it("size 'sm' forwardato al wrapper <lnk-tabs>", () => {
    const fixture = render('table', 'sm');
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.classList).toContain('lnk-tabs-size--sm');
  });

  it('valore iniziale: aria-selected sul tab corrispondente', () => {
    const fixture = render('rows');
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]');
    expect(buttons[0].getAttribute('aria-selected')).toBe('false');
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
  });

  it('click su un tab aggiorna value (two-way model)', () => {
    const fixture = render('table');
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('rows');
  });
});
