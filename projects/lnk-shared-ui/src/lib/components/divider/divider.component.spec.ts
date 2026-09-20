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
import { describe, expect, it } from 'vitest';
import { DividerComponent } from './divider.component';

describe('DividerComponent', () => {
  it('espone role=separator orizzontale, senza margin-top di default', () => {
    const fixture = TestBed.createComponent(DividerComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('separator');
    expect(host.getAttribute('aria-orientation')).toBe('horizontal');
    expect(host.style.marginTop).toBe('');
  });

  it('tight=true applica margin-top negativo', () => {
    const fixture = TestBed.createComponent(DividerComponent);
    fixture.componentRef.setInput('tight', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.marginTop).toBe('-8px');
  });
});
