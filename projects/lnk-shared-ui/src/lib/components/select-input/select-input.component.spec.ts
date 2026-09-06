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
import { SelectInputComponent, type SelectOption } from './select-input.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

const OPTIONS: SelectOption[] = [
  { value: 'a', labelKey: 'Opt.A' },
  { value: 'b', label: 'Statica B' },
];

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SelectInputComponent);
  fixture.componentRef.setInput('options', OPTIONS);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('SelectInputComponent', () => {
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

  it('renderizza placeholder + 1 option per ogni elemento', () => {
    const fixture = render();
    const options = fixture.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(1 + OPTIONS.length);
    expect(options[0].value).toBe('');
  });

  it('option con labelKey usa il translate pipe (fallback al raw)', () => {
    const fixture = render();
    const options = fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>;
    expect(options[1].textContent?.trim()).toBe('Opt.A');
  });

  it('option con label statico salta translate', () => {
    const fixture = render();
    const options = fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>;
    expect(options[2].textContent?.trim()).toBe('Statica B');
  });

  it('labelKey input: renderizza <span> sopra il select', () => {
    const fixture = render({ labelKey: 'Filtri.Stato' });
    const span = fixture.nativeElement.querySelector('span');
    expect(span).toBeTruthy();
    expect(span.textContent.trim()).toBe('Filtri.Stato');
  });

  it('senza labelKey, niente <span>', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('span')).toBeNull();
  });

  it('change event emette valueChange con il valore selezionato', () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'b';
    select.dispatchEvent(new Event('change'));

    expect(handler).toHaveBeenCalledWith('b');
  });
});
