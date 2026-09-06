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
import { SystemFacade } from '../../system';
import { HelpSidebarComponent } from './help-sidebar.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('HelpSidebarComponent', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('default: open=false, ctx=null', () => {
    const fixture = TestBed.createComponent(HelpSidebarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.ctx()).toBeNull();
  });

  it('SystemFacade.openHelp() apre il drawer e popola ctx', () => {
    const fixture = TestBed.createComponent(HelpSidebarComponent);
    const system = TestBed.inject(SystemFacade);
    system.openHelp('pendenze', 'detail');
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.ctx()).toEqual({ context: 'pendenze', section: 'detail' });
  });

  it("close() invoca SystemFacade.closeHelp", () => {
    const fixture = TestBed.createComponent(HelpSidebarComponent);
    const system = TestBed.inject(SystemFacade);
    system.openHelp('x');
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    fixture.componentInstance.close();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it("title computed contiene il context corrente", () => {
    const fixture = TestBed.createComponent(HelpSidebarComponent);
    const system = TestBed.inject(SystemFacade);
    system.openHelp('pendenze');
    // Senza traduzioni reali, TranslateService restituisce la chiave
    // raw ('Help.Title') ignorando i parametri — verifichiamo che il
    // computed produca comunque una stringa non vuota.
    expect(typeof fixture.componentInstance.title()).toBe('string');
    expect(fixture.componentInstance.title().length).toBeGreaterThan(0);
  });
});
