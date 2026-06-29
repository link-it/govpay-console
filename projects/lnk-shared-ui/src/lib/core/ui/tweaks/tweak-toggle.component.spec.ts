/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TweakToggleComponent } from './tweak-toggle.component';

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(TweakToggleComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('TweakToggleComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  it("default value=false: button role='switch' con aria-checked=false e niente is-on", () => {
    const fixture = render();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('role')).toBe('switch');
    expect(btn.getAttribute('aria-checked')).toBe('false');
    expect(btn.classList).not.toContain('is-on');
  });

  it('value=true: aria-checked true + classe is-on', () => {
    const fixture = render({ value: true });
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-checked')).toBe('true');
    expect(btn.classList).toContain('is-on');
  });

  it('click inverte il valore (two-way model)', () => {
    const fixture = render({ value: false });
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(true);

    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(false);
  });

  it('disabled=true: click ignorato, attributo disabled presente', () => {
    const fixture = render({ value: false, disabled: true });
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.hasAttribute('disabled')).toBe(true);

    fixture.componentInstance.onToggle();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(false);
  });
});
