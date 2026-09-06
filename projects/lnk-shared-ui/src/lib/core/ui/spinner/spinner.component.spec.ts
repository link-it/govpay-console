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
import { beforeEach, describe, expect, it } from 'vitest';
import { SystemFacade } from '../../system';
import { SpinnerComponent } from './spinner.component';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
}

describe('SpinnerComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    setup();
  });

  it('non renderizza nulla quando SystemFacade.loading() è false', () => {
    const fixture = TestBed.createComponent(SpinnerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lnk-overlay-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('renderizza overlay + spinner quando loading è true', () => {
    const fixture = TestBed.createComponent(SpinnerComponent);
    const system = TestBed.inject(SystemFacade);
    system.startLoading();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute('aria-live')).toBe('polite');
    expect(overlay.getAttribute('aria-busy')).toBe('true');
    expect(overlay.querySelector('.lnk-overlay-spinner')).toBeTruthy();
  });

  it('overlay scompare quando il contatore loading torna a zero', () => {
    const fixture = TestBed.createComponent(SpinnerComponent);
    const system = TestBed.inject(SystemFacade);

    system.startLoading();
    system.startLoading();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();

    system.stopLoading();
    fixture.detectChanges();
    // Counter > 0 ancora: visibile
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();

    system.stopLoading();
    fixture.detectChanges();
    // Counter == 0: nascosto
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
