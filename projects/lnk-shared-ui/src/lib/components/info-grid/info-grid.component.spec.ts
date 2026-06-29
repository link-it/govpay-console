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
import { InfoGridComponent, type InfoGridItem } from './info-grid.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(items: InfoGridItem[], inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(InfoGridComponent);
  fixture.componentRef.setInput('items', items);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('InfoGridComponent', () => {
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

  it('renderizza una <dt>/<dd> per ogni item visibile', () => {
    const fixture = render([
      { labelKey: 'L1', value: 'v1' },
      { labelKey: 'L2', value: 42 },
    ]);
    expect(fixture.nativeElement.querySelectorAll('dt').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('dd').length).toBe(2);
  });

  it('item con hide=true non viene renderizzato', () => {
    const fixture = render([
      { labelKey: 'L1', value: 'v1' },
      { labelKey: 'L2', value: 'v2', hide: true },
      { labelKey: 'L3', value: 'v3' },
    ]);
    const labels = Array.from(fixture.nativeElement.querySelectorAll('dt')).map(
      (n) => (n as HTMLElement).textContent?.trim()
    );
    expect(labels).toEqual(['L1', 'L3']);
  });

  it('value null/undefined/falsy mostra il fallback —', () => {
    const fixture = render([
      { labelKey: 'L1', value: null },
      { labelKey: 'L2', value: undefined },
      { labelKey: 'L3', value: '' },
    ]);
    const values = Array.from(fixture.nativeElement.querySelectorAll('dd')).map(
      (n) => (n as HTMLElement).textContent?.trim()
    );
    expect(values).toEqual(['—', '—', '—']);
  });

  it('mono=true applica font-mono text-xs sul <dd> (priorità sul size)', () => {
    const fixture = render(
      [{ labelKey: 'L', value: 'IT60X05428...', mono: true }],
      { size: 'lg' }
    );
    const dd = fixture.nativeElement.querySelector('dd') as HTMLElement;
    expect(dd.classList).toContain('font-mono');
    expect(dd.classList).toContain('text-xs');
    expect(dd.classList).not.toContain('text-lg');
  });

  it("size default 'sm': value text-sm, label text-xs", () => {
    const fixture = render([{ labelKey: 'L', value: 'v' }]);
    const dt = fixture.nativeElement.querySelector('dt') as HTMLElement;
    const dd = fixture.nativeElement.querySelector('dd') as HTMLElement;
    expect(dt.classList).toContain('text-xs');
    expect(dd.classList).toContain('text-sm');
  });

  it("size 'lg': value text-lg, label text-base", () => {
    const fixture = render([{ labelKey: 'L', value: 'v' }], { size: 'lg' });
    const dt = fixture.nativeElement.querySelector('dt') as HTMLElement;
    const dd = fixture.nativeElement.querySelector('dd') as HTMLElement;
    expect(dt.classList).toContain('text-base');
    expect(dd.classList).toContain('text-lg');
  });

  it("size custom 'text-2xl|text-base' spezza in coppia value|label", () => {
    const fixture = render([{ labelKey: 'L', value: 'v' }], { size: 'text-2xl|text-base' });
    const dt = fixture.nativeElement.querySelector('dt') as HTMLElement;
    const dd = fixture.nativeElement.querySelector('dd') as HTMLElement;
    expect(dt.classList).toContain('text-base');
    expect(dd.classList).toContain('text-2xl');
  });

  it('uppercaseLabels=true aggiunge uppercase + tracking-wider al <dt>', () => {
    const fixture = render([{ labelKey: 'L', value: 'v' }], { uppercaseLabels: true });
    const dt = fixture.nativeElement.querySelector('dt') as HTMLElement;
    expect(dt.classList).toContain('uppercase');
    expect(dt.classList).toContain('tracking-wider');
  });
});
