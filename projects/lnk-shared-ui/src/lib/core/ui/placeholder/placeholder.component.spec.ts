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
import { ActivatedRoute } from '@angular/router';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { SystemFacade } from '../../system';
import { PlaceholderComponent } from './placeholder.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function setup(data: Record<string, unknown> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ActivatedRoute, useValue: { data: new BehaviorSubject(data) } },
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
  });
}

describe('PlaceholderComponent', () => {
  beforeEach(() => {
    setup();
  });

  it("senza route.data.title usa il fallback 'Placeholder.NotImplemented'", () => {
    const fixture = TestBed.createComponent(PlaceholderComponent);
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent.trim()).toBe('Placeholder.NotImplemented');
  });

  it("route.data.title valorizzato → renderizza la chiave fornita", () => {
    setup({ title: 'Nav.Pendenze' });
    const fixture = TestBed.createComponent(PlaceholderComponent);
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent.trim()).toBe('Nav.Pendenze');
  });

  it("ngOnInit imposta i breadcrumb del SystemFacade", () => {
    setup({ title: 'Nav.Tracciati' });
    const fixture = TestBed.createComponent(PlaceholderComponent);
    fixture.detectChanges();

    const system = TestBed.inject(SystemFacade);
    expect(system.breadcrumbs()).toEqual([{ label: 'Nav.Tracciati' }]);
  });

  it("renderizza paragrafo Placeholder.NotImplemented", () => {
    const fixture = TestBed.createComponent(PlaceholderComponent);
    fixture.detectChanges();
    const p = fixture.nativeElement.querySelector('p');
    expect(p.textContent.trim()).toBe('Placeholder.NotImplemented');
  });
});
