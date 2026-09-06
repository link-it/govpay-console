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

import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackButtonComponent } from './back-button.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function setup(locationMock: Partial<Location> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
      { provide: Location, useValue: { back: vi.fn(), ...locationMock } },
    ],
  });
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(BackButtonComponent);
  for (const [k, v] of Object.entries(inputs)) {
    fixture.componentRef.setInput(k, v);
  }
  fixture.detectChanges();
  return fixture;
}

describe('BackButtonComponent', () => {
  beforeEach(() => setup());

  it("default: renderizza un <button> con labelKey 'Common.Back'", () => {
    const fixture = render();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Common.Back');
  });

  it('targetRoute valorizzato → renderizza un <a routerLink> invece del button', () => {
    const fixture = render({ targetRoute: '/audit' });
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    const a = fixture.nativeElement.querySelector('a');
    expect(a).toBeTruthy();
    expect(a.getAttribute('href')).toContain('/audit');
  });

  it('click sul button chiama Location.back()', () => {
    const backSpy = vi.fn();
    setup({ back: backSpy });
    const fixture = render();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it("output (back) emette evento; preventDefault() blocca Location.back()", () => {
    const backSpy = vi.fn();
    setup({ back: backSpy });
    const fixture = render();
    fixture.componentRef.instance.back.subscribe((ev) => ev.preventDefault());
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(backSpy).not.toHaveBeenCalled();
  });

  it("size='lg' applica la classe btn-lg", () => {
    const fixture = render({ size: 'lg' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.classList).toContain('btn-lg');
  });
});
