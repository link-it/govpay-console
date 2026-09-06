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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

@Component({
  standalone: true,
  imports: [InfiniteScrollDirective],
  template: `
    <div
      lnkInfiniteScroll
      [enabled]="enabled"
      [rootMargin]="rootMargin"
      (scrolled)="onScrolled()"
    ></div>
  `,
})
class HostComponent {
  enabled = true;
  rootMargin = '200px';
  scrolledCount = 0;
  onScrolled() {
    this.scrolledCount += 1;
  }
}

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;

// Stato condiviso tra istanze: ogni FakeIO si registra qui per
// permettere ai test di triggerare il callback e di osservare il
// disconnect.
const fakeIO = {
  callbacks: [] as IOCallback[],
  observers: [] as { disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn> }[],
  reset() {
    this.callbacks.length = 0;
    this.observers.length = 0;
  },
};

class FakeIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = () => [];
  root = null;
  rootMargin = '';
  thresholds = [];
  constructor(cb: IOCallback) {
    fakeIO.callbacks.push(cb);
    fakeIO.observers.push(this);
  }
}

describe('InfiniteScrollDirective', () => {
  const originalIO = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;

  beforeEach(() => {
    fakeIO.reset();
    (globalThis as { IntersectionObserver: unknown }).IntersectionObserver = FakeIntersectionObserver;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  afterEach(() => {
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = originalIO;
  });

  function render(initial: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, initial);
    fixture.detectChanges();
    return fixture;
  }

  it('crea un IntersectionObserver quando enabled=true (default)', () => {
    render();
    expect(fakeIO.observers.length).toBe(1);
    expect(fakeIO.observers[0].observe).toHaveBeenCalled();
  });

  it('enabled=false: nessun observer creato', () => {
    render({ enabled: false });
    expect(fakeIO.observers.length).toBe(0);
  });

  it("isIntersecting=true emette l'output `scrolled`", () => {
    const fixture = render();
    fakeIO.callbacks[0]([{ isIntersecting: true }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.scrolledCount).toBe(1);
  });

  it('isIntersecting=false: niente emit', () => {
    const fixture = render();
    fakeIO.callbacks[0]([{ isIntersecting: false }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.scrolledCount).toBe(0);
  });

  it("destroy del componente disconnette l'observer", () => {
    const fixture = render();
    const observer = fakeIO.observers[0];
    fixture.destroy();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
