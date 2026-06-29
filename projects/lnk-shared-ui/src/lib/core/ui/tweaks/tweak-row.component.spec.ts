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
import { TweakRowComponent } from './tweak-row.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(TweakRowComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('TweakRowComponent', () => {
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

  it('default inline=false: applica la classe stack', () => {
    const fixture = render({ labelKey: 'L' });
    const wrapper = fixture.nativeElement.querySelector('.lnk-tweak-row--stack');
    expect(wrapper).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lnk-tweak-row--inline')).toBeNull();
  });

  it('inline=true: applica la classe inline', () => {
    const fixture = render({ labelKey: 'L', inline: true });
    expect(fixture.nativeElement.querySelector('.lnk-tweak-row--inline')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lnk-tweak-row--stack')).toBeNull();
  });

  it('labelKey renderizza il <span> label', () => {
    const fixture = render({ labelKey: 'Tweaks.View' });
    const label = fixture.nativeElement.querySelector('.lnk-tweak-row__label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Tweaks.View');
  });

  it('hintKey renderizza lo <span> hint sotto la label', () => {
    const fixture = render({ labelKey: 'L', hintKey: 'Tweaks.Hint' });
    const hint = fixture.nativeElement.querySelector('.lnk-tweak-row__hint');
    expect(hint).toBeTruthy();
    expect(hint.textContent.trim()).toBe('Tweaks.Hint');
  });

  it('senza labelKey, niente label-wrap', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.lnk-tweak-row__label-wrap')).toBeNull();
  });

  it('senza hintKey, niente hint (anche con labelKey)', () => {
    const fixture = render({ labelKey: 'L' });
    expect(fixture.nativeElement.querySelector('.lnk-tweak-row__hint')).toBeNull();
  });
});
