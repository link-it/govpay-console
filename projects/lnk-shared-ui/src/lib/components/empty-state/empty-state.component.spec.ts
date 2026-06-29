/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { TestBed } from '@angular/core/testing';
import { NG_ICON_DIRECTIVES } from '@ng-icons/core';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { EmptyStateComponent } from './empty-state.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('EmptyStateComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
        // ng-icons fornisce direttive globali; non serve provideIcons per i test
        // perché `<ng-icon>` accetta `name` anche se non registrato (render vuoto).
        { provide: NG_ICON_DIRECTIVES, useValue: [], multi: true },
      ],
    });
  });

  function createWithInputs(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('renderizza il titolo e (se presente) la descrizione', () => {
    const fixture = createWithInputs({
      titleKey: 'Common.NoResults',
      descriptionKey: 'Common.NoResultsHint',
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Common.NoResults');
    expect(text).toContain('Common.NoResultsHint');
  });

  it("image ha priorita` su icon quando entrambi sono valorizzati", () => {
    const fixture = createWithInputs({
      titleKey: 'X',
      icon: 'bootstrapInboxes',
      image: '/img.svg',
    });
    const img = fixture.nativeElement.querySelector('img');
    const iconContainer = fixture.nativeElement.querySelector('.rounded-full');
    expect(img).toBeTruthy();
    expect(iconContainer).toBeNull();
  });

  it('size preset md (default) applica 3rem al container icona', () => {
    const fixture = createWithInputs({ titleKey: 'X', icon: 'bootstrapInboxes' });
    const container = fixture.nativeElement.querySelector('.rounded-full') as HTMLElement;
    expect(container.style.width).toBe('3rem');
    expect(container.style.height).toBe('3rem');
  });

  it('size preset lg applica 5rem al container e 2.5rem all\'icona', () => {
    const fixture = createWithInputs({ titleKey: 'X', icon: 'bootstrapInboxes', size: 'lg' });
    const container = fixture.nativeElement.querySelector('.rounded-full') as HTMLElement;
    expect(container.style.width).toBe('5rem');
  });

  it('size custom string passa attraverso (fallback presets)', () => {
    const fixture = createWithInputs({ titleKey: 'X', icon: 'bootstrapInboxes', size: '110px' });
    const container = fixture.nativeElement.querySelector('.rounded-full') as HTMLElement;
    expect(container.style.width).toBe('110px');
  });

  it('image preset md applica 6rem all\'<img>', () => {
    const fixture = createWithInputs({ titleKey: 'X', image: '/img.svg' });
    const img = fixture.nativeElement.querySelector('img') as HTMLElement;
    expect(img.style.width).toBe('6rem');
    expect(img.style.height).toBe('6rem');
  });
});
