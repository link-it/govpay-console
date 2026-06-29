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
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from '../../i18n';
import { LanguageMenuComponent } from './language-menu.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(LanguageMenuComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('LanguageMenuComponent', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('default isOpen=false: pannello chiuso, aria-expanded false', () => {
    const fixture = render();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    const btn = fixture.nativeElement.querySelector('button[aria-haspopup="true"]') as HTMLButtonElement;
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggle() apre il menu', () => {
    const fixture = render();
    const btn = fixture.nativeElement.querySelector('button[aria-haspopup="true"]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('toggle() su menu aperto lo chiude', () => {
    const fixture = render();
    const btn = fixture.nativeElement.querySelector('button[aria-haspopup="true"]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it("Escape chiude il menu aperto", () => {
    const fixture = render();
    fixture.componentInstance.isOpen.set(true);
    fixture.componentInstance.onEscape();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('select(code) cambia la lingua e chiude il menu', () => {
    const fixture = render();
    const i18n = TestBed.inject(LanguageService);
    fixture.componentInstance.isOpen.set(true);

    fixture.componentInstance.select('en');

    expect(i18n.current()).toBe('en');
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('document:click fuori dal componente chiude il menu', () => {
    const fixture = render();
    fixture.componentInstance.isOpen.set(true);

    // target fuori dall'host
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    fixture.componentInstance.onDocClick(outside);
    expect(fixture.componentInstance.isOpen()).toBe(false);
    outside.remove();
  });

  it('document:click dentro il componente NON chiude il menu', () => {
    const fixture = render();
    fixture.componentInstance.isOpen.set(true);
    const insideTarget = fixture.nativeElement.querySelector('button');
    fixture.componentInstance.onDocClick(insideTarget);
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('currentShort: deriva da current().short (default it → IT)', () => {
    const fixture = render();
    const i18n = TestBed.inject(LanguageService);
    i18n.setLanguage('it');
    expect(fixture.componentInstance.currentShort()).toBe('IT');
    i18n.setLanguage('en');
    expect(fixture.componentInstance.currentShort()).toBe('EN');
  });
});
