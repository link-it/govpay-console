/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { OverlayModule } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TweaksPanelComponent } from './tweaks-panel.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(TweaksPanelComponent);
  fixture.componentRef.setInput('titleKey', 'Tweaks.Title');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('TweaksPanelComponent', () => {
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
  });

  it("default: pannello chiuso, FAB visibile (showFab=true)", () => {
    const fixture = render();
    expect(fixture.componentInstance.open()).toBe(false);
    const fab = fixture.nativeElement.querySelector('.lnk-tweaks-fab');
    expect(fab).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it("open=true: dialog visibile, FAB nascosto", () => {
    const fixture = render({ open: true });
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lnk-tweaks-fab')).toBeNull();
  });

  it("showFab=false: niente FAB anche se chiuso", () => {
    const fixture = render({ showFab: false });
    expect(fixture.nativeElement.querySelector('.lnk-tweaks-fab')).toBeNull();
  });

  it("toggle() inverte open (two-way)", () => {
    const fixture = render();
    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.open()).toBe(true);
    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it("close() chiude e azzera la posizione floating", () => {
    const fixture = render({ open: true });
    fixture.componentInstance['pos'].set({ x: 100, y: 200 });
    fixture.componentInstance.close();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance['pos']()).toBeNull();
  });

  it("Escape su document chiude il pannello aperto", () => {
    const fixture = render({ open: true });
    fixture.componentInstance.onEscape();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it("Escape su pannello già chiuso: no-op", () => {
    const fixture = render({ open: false });
    fixture.componentInstance.onEscape();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it("placementClass + fabPositionClass derivano dagli input", () => {
    const fixture = render({ placement: 'right', fabPosition: 'top-left' });
    expect(fixture.componentInstance['placementClass']()).toBe('lnk-tweaks-panel--right');
    expect(fixture.componentInstance['fabPositionClass']()).toBe('lnk-tweaks-fab--top-left');
  });

  it("showOverlay: true se placement non e` 'floating'", () => {
    const fixture = render({ placement: 'right' });
    expect(fixture.componentInstance['showOverlay']()).toBe(true);
  });

  it("showOverlay: false con placement 'floating' (default)", () => {
    const fixture = render();
    expect(fixture.componentInstance['showOverlay']()).toBe(false);
  });

  it("hasFloatingPosition: false di default (pos null)", () => {
    const fixture = render();
    expect(fixture.componentInstance['hasFloatingPosition']()).toBe(false);
    expect(fixture.componentInstance['floatTop']()).toBeNull();
    expect(fixture.componentInstance['floatLeft']()).toBeNull();
  });

  it("hasFloatingPosition: true quando floating + pos valorizzata", () => {
    const fixture = render();
    fixture.componentInstance['pos'].set({ x: 50, y: 60 });
    expect(fixture.componentInstance['hasFloatingPosition']()).toBe(true);
    expect(fixture.componentInstance['floatTop']()).toBe(60);
    expect(fixture.componentInstance['floatLeft']()).toBe(50);
  });

  it("showReset=true: footer con pulsante reset visibile", () => {
    const fixture = render({ open: true, showReset: true });
    const resetBtn = fixture.nativeElement.querySelector('.lnk-tweaks-footer button');
    expect(resetBtn).toBeTruthy();
    expect(resetBtn.textContent.trim()).toBe('Tweaks.Reset');
  });

  it("onReset emette l'output reset", () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.reset.subscribe(handler);
    fixture.componentInstance.onReset();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
