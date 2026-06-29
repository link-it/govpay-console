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
import { StatusBadgeComponent } from './status-badge.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('StatusBadgeComponent', () => {
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

  it("default tone è 'muted'", () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('labelKey', 'Stato.Pagato');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.style.color).toBe('var(--status-muted-text)');
    expect(span.style.backgroundColor).toBe('var(--status-muted-bg)');
  });

  it('applica i token CSS in base al tone', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('labelKey', 'X');
    fixture.componentRef.setInput('tone', 'success');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.style.color).toBe('var(--status-success-text)');
    expect(span.style.backgroundColor).toBe('var(--status-success-bg)');
  });

  it('renderizza il labelKey (fallback al raw quando non ci sono traduzioni)', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('labelKey', 'Stato.Pagato');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Stato.Pagato');
  });
});
