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

import { OverlayModule } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GotoTopComponent } from './goto-top.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}

describe('GotoTopComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
    setScrollY(0);
  });

  it('default: pulsante invisibile (opacity-0, tabIndex -1)', () => {
    const fixture = TestBed.createComponent(GotoTopComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.classList).toContain('opacity-0');
    expect(btn.tabIndex).toBe(-1);
    expect(btn.getAttribute('aria-hidden')).toBe('true');
  });

  it('window:scroll > 200 → pulsante diventa visibile', () => {
    const fixture = TestBed.createComponent(GotoTopComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.classList).toContain('opacity-0');

    setScrollY(250);
    fixture.componentInstance.onScroll();
    fixture.detectChanges();

    expect(btn.classList).not.toContain('opacity-0');
    expect(btn.tabIndex).toBe(0);
    expect(btn.getAttribute('aria-hidden')).toBe('false');
  });

  it("scrollToTop() invoca window.scrollTo({ top: 0, behavior: 'smooth' })", () => {
    const fixture = TestBed.createComponent(GotoTopComponent);
    fixture.detectChanges();
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      /* no-op */
    });

    fixture.componentInstance.scrollToTop();

    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    spy.mockRestore();
  });

  it('click sul button (quando visibile) invoca scrollTo', () => {
    const fixture = TestBed.createComponent(GotoTopComponent);
    fixture.detectChanges();
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      /* no-op */
    });

    setScrollY(300);
    fixture.componentInstance.onScroll();
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
