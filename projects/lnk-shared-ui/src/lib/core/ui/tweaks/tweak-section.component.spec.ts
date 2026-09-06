/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { TweakSectionComponent } from './tweak-section.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(TweakSectionComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('TweakSectionComponent', () => {
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

  it('senza titleKey/descriptionKey: rende solo lo slot di contenuto', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('h3')).toBeNull();
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
    expect(fixture.nativeElement.querySelector('.space-y-3')).toBeTruthy();
  });

  it('titleKey renderizza <h3> con title class', () => {
    const fixture = render({ titleKey: 'Tweaks.Layout' });
    const h3 = fixture.nativeElement.querySelector('h3');
    expect(h3).toBeTruthy();
    expect(h3.classList).toContain('lnk-tweak-section__title');
    expect(h3.textContent.trim()).toBe('Tweaks.Layout');
  });

  it('descriptionKey renderizza <p> sotto al titolo', () => {
    const fixture = render({ titleKey: 'T', descriptionKey: 'Tweaks.LayoutHint' });
    const p = fixture.nativeElement.querySelector('p');
    expect(p).toBeTruthy();
    expect(p.classList).toContain('lnk-tweak-section__description');
    expect(p.textContent.trim()).toBe('Tweaks.LayoutHint');
  });

  it('descriptionKey senza titleKey funziona comunque', () => {
    const fixture = render({ descriptionKey: 'OnlyDesc' });
    expect(fixture.nativeElement.querySelector('h3')).toBeNull();
    expect(fixture.nativeElement.querySelector('p')).toBeTruthy();
  });
});
