/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LnkTooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [LnkTooltipDirective],
  template: `
    <button
      #host
      [lnkTooltip]="text"
      [lnkTooltipPosition]="position"
      [lnkTooltipDelay]="delay"
      [lnkTooltipDisabled]="disabled"
    >hover me</button>
  `,
})
class HostComponent {
  text: string | null | undefined = 'Ciao';
  position: 'above' | 'below' | 'left' | 'right' = 'above';
  delay = 0;
  disabled = false;
  // @ts-expect-error host element accesso via ViewChild su #host
  @ViewChild('host', { read: HTMLButtonElement }) hostEl!: HTMLButtonElement;
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [OverlayModule, HostComponent],
  });
}

function renderHost(initial: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, initial);
  fixture.detectChanges();
  return fixture;
}

describe('LnkTooltipDirective', () => {
  beforeEach(() => {
    setup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Pulizia eventuali overlay panel rimasti nel DOM tra i test
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  it('mouseenter senza testo: nessun overlay creato', () => {
    const fixture = renderHost({ text: '' });
    const overlay = TestBed.inject(Overlay);
    const createSpy = vi.spyOn(overlay, 'create');

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(500);

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('mouseenter con disabled=true: nessun overlay creato', () => {
    const fixture = renderHost({ text: 'Ciao', disabled: true });
    const overlay = TestBed.inject(Overlay);
    const createSpy = vi.spyOn(overlay, 'create');

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(500);

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('mouseenter rispetta il delay prima di creare overlay', () => {
    const fixture = renderHost({ text: 'Ciao', delay: 300 });
    const overlay = TestBed.inject(Overlay);
    const createSpy = vi.spyOn(overlay, 'create');

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));

    expect(createSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(createSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('mouseleave prima del delay cancella il timer (overlay mai creato)', () => {
    const fixture = renderHost({ text: 'Ciao', delay: 300 });
    const overlay = TestBed.inject(Overlay);
    const createSpy = vi.spyOn(overlay, 'create');

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(100);
    btn.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(500);

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('show + hide gestiscono aria-describedby sull\'host', () => {
    const fixture = renderHost({ text: 'Ciao', delay: 0 });

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.hasAttribute('aria-describedby')).toBe(false);

    btn.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(0);
    expect(btn.hasAttribute('aria-describedby')).toBe(true);

    btn.dispatchEvent(new MouseEvent('mouseleave'));
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
  });

  it('Escape su document chiude il tooltip aperto', () => {
    const fixture = renderHost({ text: 'Ciao', delay: 0 });

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(0);
    expect(btn.hasAttribute('aria-describedby')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
  });

  it('destroy del componente host rilascia overlay e timer', () => {
    const fixture = renderHost({ text: 'Ciao', delay: 200 });

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.destroy();

    // Nessun overlay creato (timer cancellato in ngOnDestroy).
    expect(document.querySelectorAll('.cdk-overlay-pane').length).toBe(0);
  });
});
