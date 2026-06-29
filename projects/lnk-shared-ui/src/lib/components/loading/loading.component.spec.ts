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
import { LoadingComponent } from './loading.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
  });
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(LoadingComponent);
  for (const [k, v] of Object.entries(inputs)) {
    fixture.componentRef.setInput(k, v);
  }
  fixture.detectChanges();
  return fixture;
}

describe('LoadingComponent', () => {
  beforeEach(() => setup());

  it("default labelKey è 'Common.Loading' e modalità non-inline (block flex-col)", () => {
    const fixture = render();
    const wrapper = fixture.nativeElement.querySelector('.flex-col') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Common.Loading');
  });

  it('inline=true rende uno span inline-flex senza padding verticale', () => {
    const fixture = render({ inline: true });
    expect(fixture.nativeElement.querySelector('.flex-col')).toBeNull();
    expect(fixture.nativeElement.querySelector('.inline-flex')).toBeTruthy();
  });

  it('labelKey=null mostra solo lo spinner', () => {
    const fixture = render({ labelKey: null, inline: true });
    expect(fixture.nativeElement.querySelector('.lnk-spinner')).toBeTruthy();
    // Niente <span> dopo lo spinner: il textContent dovrebbe essere vuoto.
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it("size='sm' applica le classi w-3.5 h-3.5 border-2", () => {
    const fixture = render({ size: 'sm' });
    const spinner = fixture.nativeElement.querySelector('.lnk-spinner') as HTMLElement;
    expect(spinner.classList).toContain('w-3.5');
    expect(spinner.classList).toContain('h-3.5');
    expect(spinner.classList).toContain('border-2');
  });

  it("size='lg' applica w-10 h-10 border-4", () => {
    const fixture = render({ size: 'lg' });
    const spinner = fixture.nativeElement.querySelector('.lnk-spinner') as HTMLElement;
    expect(spinner.classList).toContain('w-10');
    expect(spinner.classList).toContain('h-10');
    expect(spinner.classList).toContain('border-4');
  });
});
