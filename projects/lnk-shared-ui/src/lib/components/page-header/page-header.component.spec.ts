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
import { PageHeaderComponent } from './page-header.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(PageHeaderComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('PageHeaderComponent', () => {
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

  it('renderizza titolo e (se presente) sottotitolo', () => {
    const fixture = render({ titleKey: 'Nav.Pendenze', subtitleKey: 'Pendenze.Subtitle' });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nav.Pendenze');
    expect(text).toContain('Pendenze.Subtitle');
  });

  it('senza subtitleKey, non renderizza il <p>', () => {
    const fixture = render({ titleKey: 'X' });
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });

  it("titleSize default 'xl' applica text-2xl al <h1>", () => {
    const fixture = render({ titleKey: 'X' });
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.classList).toContain('text-2xl');
  });

  it("titleSize 'sm' applica text-base al <h1>", () => {
    const fixture = render({ titleKey: 'X', titleSize: 'sm' });
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.classList).toContain('text-base');
  });

  it('titleSize arbitrario (stringa Tailwind) viene passato as-is', () => {
    const fixture = render({ titleKey: 'X', titleSize: 'text-4xl' });
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.classList).toContain('text-4xl');
  });

  it('total numerico viene renderizzato accanto al titolo', () => {
    const fixture = render({ titleKey: 'X', total: 1234 });
    const counter = fixture.nativeElement.querySelector('.tabular-nums') as HTMLElement;
    expect(counter).toBeTruthy();
    // `formatNumber` usa Intl.NumberFormat('it-IT'): in ambienti con
    // pieno ICU produce '1.234', altrimenti '1234'. Verifichiamo solo
    // che il contenuto contenga le cifre attese (la formattazione esatta
    // dipende dal runtime di test).
    expect(counter.textContent).toMatch(/1\.?234/);
  });

  it('loading=true sostituisce il counter con uno spinner inline', () => {
    const fixture = render({ titleKey: 'X', total: 50, loading: true });
    expect(fixture.nativeElement.querySelector('lnk-loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.tabular-nums')).toBeNull();
  });

  it('total null: nessun counter renderizzato', () => {
    const fixture = render({ titleKey: 'X', total: null });
    expect(fixture.nativeElement.querySelector('.tabular-nums')).toBeNull();
    expect(fixture.nativeElement.querySelector('lnk-loading')).toBeNull();
  });
});
