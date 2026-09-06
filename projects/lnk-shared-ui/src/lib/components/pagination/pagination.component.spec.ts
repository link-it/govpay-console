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
import { PaginationComponent } from './pagination.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Partial<{ page: number; pageSize: number; total: number; pageSizes: number[] }>) {
  const fixture = TestBed.createComponent(PaginationComponent);
  const defaults = { page: 1, pageSize: 25, total: 0, pageSizes: [10, 25, 50, 100] };
  const merged = { ...defaults, ...inputs };
  for (const [k, v] of Object.entries(merged)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('PaginationComponent', () => {
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

  it('totalPages: 0 risultati → 1 pagina (no division by zero)', () => {
    const fixture = render({ total: 0 });
    expect(fixture.componentInstance.totalPages()).toBe(1);
  });

  it('totalPages = ceil(total / pageSize)', () => {
    const fixture = render({ total: 101, pageSize: 25 });
    // 101 / 25 = 4.04 → 5
    expect(fixture.componentInstance.totalPages()).toBe(5);
  });

  it('rangeFrom / rangeTo su pagina 2 con pageSize 25 e total 60', () => {
    const fixture = render({ page: 2, pageSize: 25, total: 60 });
    expect(fixture.componentInstance.rangeFrom()).toBe(26);
    expect(fixture.componentInstance.rangeTo()).toBe(50);
  });

  it('rangeTo non eccede il totale (ultima pagina parziale)', () => {
    const fixture = render({ page: 3, pageSize: 25, total: 60 });
    expect(fixture.componentInstance.rangeFrom()).toBe(51);
    expect(fixture.componentInstance.rangeTo()).toBe(60);
  });

  it('goTo emette pageChange solo se la pagina cambia davvero', () => {
    const fixture = render({ page: 2, pageSize: 10, total: 100 });
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => emitted.push(p));

    fixture.componentInstance.goTo(5);
    fixture.componentInstance.goTo(2); // stessa pagina, no emit
    fixture.componentInstance.goTo(2);

    expect(emitted).toEqual([5]);
  });

  it('goTo clamp tra 1 e totalPages', () => {
    // page e` un input read-only nel componente: senza two-way binding
    // dal test, `page()` resta a 1 anche dopo emit. Verifichiamo solo
    // che il clamp produca il target atteso (1 o totalPages).
    const fixture = render({ page: 1, pageSize: 10, total: 50 }); // totalPages=5
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => emitted.push(p));

    fixture.componentInstance.goTo(0); // → 1, page=1, no emit
    fixture.componentInstance.goTo(999); // → 5
    fixture.componentInstance.goTo(-5); // → 1, page=1, no emit (page non aggiornato)

    expect(emitted).toEqual([5]);
  });

  it('pulsanti prev disabilitati su pagina 1', () => {
    const fixture = render({ page: 1, pageSize: 10, total: 100 });
    const btns = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    // first 2 sono "First" e "Previous"
    expect(btns[0].disabled).toBe(true);
    expect(btns[1].disabled).toBe(true);
    // last 2 sono "Next" e "Last"
    expect(btns[2].disabled).toBe(false);
    expect(btns[3].disabled).toBe(false);
  });

  it('pulsanti next disabilitati su ultima pagina', () => {
    const fixture = render({ page: 5, pageSize: 10, total: 50 });
    const btns = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(btns[2].disabled).toBe(true);
    expect(btns[3].disabled).toBe(true);
  });

  it('select change emette pageSizeChange', () => {
    const fixture = render({ pageSize: 25, total: 100 });
    const handler = vi.fn();
    fixture.componentInstance.pageSizeChange.subscribe(handler);

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(handler).toHaveBeenCalledWith(50);
  });
});
