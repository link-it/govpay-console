/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DetailSectionComponent } from './detail-section.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('DetailSectionComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });

  it('renderizza il titleKey nell\'header', () => {
    const fixture = TestBed.createComponent(DetailSectionComponent);
    fixture.componentRef.setInput('titleKey', 'Pendenze.Detail.Generali');
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2.textContent.trim()).toBe('Pendenze.Detail.Generali');
  });

  it('struttura: <section> > header + content slot', () => {
    const fixture = TestBed.createComponent(DetailSectionComponent);
    fixture.componentRef.setInput('titleKey', 'X');
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section');
    expect(section).toBeTruthy();
    expect(section.querySelector('header')).toBeTruthy();
    // Il <div class="p-4"> e` l'host del content projection (variant card default)
    expect(section.querySelector('.p-4')).toBeTruthy();
  });

  it('variant default (auto, fuori da group) → card: bordo + bg + shadow', () => {
    const fixture = TestBed.createComponent(DetailSectionComponent);
    fixture.componentRef.setInput('titleKey', 'X');
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.className).toContain('rounded-md');
    expect(section.className).toContain('border-[var(--card-border)]');
    expect(section.className).toContain('bg-[var(--card-bg)]');
    expect(section.className).toContain('shadow-[var(--card-shadow)]');
  });

  it("variant='embedded' esplicito: niente bordo/bg/shadow + divider sul <h2> (allineato al testo)", () => {
    const fixture = TestBed.createComponent(DetailSectionComponent);
    fixture.componentRef.setInput('titleKey', 'X');
    fixture.componentRef.setInput('variant', 'embedded');
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;

    // Niente bordo/bg/shadow sul section embedded
    expect(section.className).not.toContain('rounded-md');
    expect(section.className).not.toContain('bg-[var(--card-bg)]');
    expect(section.className).not.toContain('shadow-[var(--card-shadow)]');
    // Header embedded: px-4 pt-3, NIENTE border-b (il divider va sul <h2>)
    expect(header.className).toContain('px-4');
    expect(header.className).toContain('pt-3');
    expect(header.className).not.toContain('py-3');
    expect(header.className).not.toContain('border-b');
    // Divider sotto il titolo applicato direttamente al <h2>: pb-3 + border-b
    expect(h2.className).toContain('pb-3');
    expect(h2.className).toContain('border-b');
    expect(h2.className).toContain('border-[var(--card-border)]');
    // Content wrapper con .p-4 mantenuto
    expect(section.querySelector('.p-4')).not.toBeNull();
    // Host attribute data-variant per gli stili :host([data-variant])
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-variant')).toBe('embedded');
  });

  it("variant='card': border-b sull'<header> (non sul <h2>), <h2> con solo classi tipografiche", () => {
    const fixture = TestBed.createComponent(DetailSectionComponent);
    fixture.componentRef.setInput('titleKey', 'X');
    fixture.componentRef.setInput('variant', 'card');
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;

    // Header card: px-4 py-3 + border-b
    expect(header.className).toContain('px-4');
    expect(header.className).toContain('py-3');
    expect(header.className).toContain('border-b');
    // <h2> NON ha border (e` sull'header)
    expect(h2.className).not.toContain('border-b');
    expect(h2.className).not.toContain('pb-3');
  });

  it("variant='card' esplicito: applica comunque card anche se in futuro inietto LNK_IN_DETAIL_GROUP", () => {
    const fixture = TestBed.createComponent(DetailSectionComponent);
    fixture.componentRef.setInput('titleKey', 'X');
    fixture.componentRef.setInput('variant', 'card');
    fixture.detectChanges();
    expect(fixture.componentInstance['effectiveVariant']()).toBe('card');
  });
});
