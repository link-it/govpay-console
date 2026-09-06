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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ConfirmDialogComponent);
  fixture.componentRef.setInput('messageKey', 'Msg');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('ConfirmDialogComponent', () => {
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

  it('open=false: non renderizza il dialog', () => {
    const fixture = render({ open: false });
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('open=true: renderizza titolo, messaggio e due azioni', () => {
    const fixture = render({ open: true, titleKey: 'Titolo' });
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Titolo');
    expect(dialog.textContent).toContain('Msg');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(2);
  });

  it('emette confirm sul pulsante primario', () => {
    const fixture = render({ open: true });
    const spy = vi.fn();
    fixture.componentInstance.confirm.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('emette cancel sul pulsante secondario e sul backdrop', () => {
    const fixture = render({ open: true });
    const spy = vi.fn();
    fixture.componentInstance.cancel.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    fixture.nativeElement.querySelector('.absolute.inset-0').click();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
