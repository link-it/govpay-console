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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateInputComponent } from './date-input.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(DateInputComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('DateInputComponent', () => {
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

  it("renderizza <input type='date'> con value", () => {
    const fixture = render({ value: '2026-05-30' });
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('date');
    expect(input.value).toBe('2026-05-30');
  });

  it('applica min e max attributes', () => {
    const fixture = render({ value: '', min: '2026-01-01', max: '2026-12-31' });
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('min')).toBe('2026-01-01');
    expect(input.getAttribute('max')).toBe('2026-12-31');
  });

  it('labelKey: renderizza <span> sopra l\'input', () => {
    const fixture = render({ labelKey: 'Filters.DataDa' });
    const span = fixture.nativeElement.querySelector('span');
    expect(span).toBeTruthy();
    expect(span.textContent.trim()).toBe('Filters.DataDa');
  });

  it('senza labelKey, niente <span>', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('span')).toBeNull();
  });

  it('change event emette valueChange', () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '2026-12-25';
    input.dispatchEvent(new Event('change'));

    expect(handler).toHaveBeenCalledWith('2026-12-25');
  });
});
