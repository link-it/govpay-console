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

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListStickyToolbarDirective } from './list-sticky-toolbar.directive';

@Component({
  standalone: true,
  imports: [ListStickyToolbarDirective],
  template: `<div lnkListStickyToolbar>Toolbar</div>`,
})
class HostComponent {}

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}

describe('ListStickyToolbarDirective', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    setScrollY(0);
    document.documentElement.style.removeProperty('--lnk-list-toolbar-h');
  });

  it("applica le classi sticky di base sull'host", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[lnkListStickyToolbar]') as HTMLElement;
    expect(host.classList).toContain('sticky');
    expect(host.classList).toContain('z-30');
  });

  it("default scrollY=0: classe lnk-toolbar-stuck assente", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[lnkListStickyToolbar]') as HTMLElement;
    expect(host.classList).not.toContain('lnk-toolbar-stuck');
  });

  it("scrollY > 8: classe lnk-toolbar-stuck applicata", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[lnkListStickyToolbar]') as HTMLElement;

    setScrollY(20);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(host.classList).toContain('lnk-toolbar-stuck');
  });

  it("scrollY torna a 0: la classe stuck viene rimossa", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[lnkListStickyToolbar]') as HTMLElement;

    setScrollY(20);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.classList).toContain('lnk-toolbar-stuck');

    setScrollY(0);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.classList).not.toContain('lnk-toolbar-stuck');
  });

  it("destroy pulisce la CSS var --lnk-list-toolbar-h da <html>", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    document.documentElement.style.setProperty('--lnk-list-toolbar-h', '48px');
    fixture.destroy();
    expect(document.documentElement.style.getPropertyValue('--lnk-list-toolbar-h')).toBe('');
  });
});
