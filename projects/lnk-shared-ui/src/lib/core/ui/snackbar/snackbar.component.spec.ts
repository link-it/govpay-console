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
import { SnackbarComponent } from './snackbar.component';
import { SnackbarService } from './snackbar.service';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('SnackbarComponent', () => {
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

  it('coda vuota: nessuna riga renderizzata', () => {
    const fixture = TestBed.createComponent(SnackbarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.shadow-lg').length).toBe(0);
  });

  it('1 messaggio per livello: rende 4 righe', () => {
    const fixture = TestBed.createComponent(SnackbarComponent);
    const svc = TestBed.inject(SnackbarService);

    svc.success('OK', 0);
    svc.info('Info', 0);
    svc.show('Attento', 'warning', 0);
    svc.error('Errore', 0);

    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.shadow-lg');
    expect(rows.length).toBe(4);
    const texts = Array.from(rows).map((r) =>
      (r as HTMLElement).textContent?.replace(/\s+/g, ' ').trim()
    );
    expect(texts[0]).toContain('OK');
    expect(texts[1]).toContain('Info');
    expect(texts[2]).toContain('Attento');
    expect(texts[3]).toContain('Errore');
  });

  it('iconFor / colorVar mappano correttamente i livelli', () => {
    const fixture = TestBed.createComponent(SnackbarComponent);
    const cmp = fixture.componentInstance;

    expect(cmp.iconFor('success')).toBe('bootstrapCheckCircle');
    expect(cmp.iconFor('info')).toBe('bootstrapInfoCircle');
    expect(cmp.iconFor('warning')).toBe('bootstrapExclamationTriangle');
    expect(cmp.iconFor('error')).toBe('bootstrapXCircle');

    expect(cmp.colorVar('success')).toBe('--success');
    expect(cmp.colorVar('info')).toBe('--info');
    expect(cmp.colorVar('warning')).toBe('--warning');
    expect(cmp.colorVar('error')).toBe('--danger');
  });

  it("click sul pulsante chiudi rimuove il messaggio dalla coda", () => {
    const fixture = TestBed.createComponent(SnackbarComponent);
    const svc = TestBed.inject(SnackbarService);
    const id = svc.info('Messaggio', 0);
    fixture.detectChanges();
    expect(svc.messages()).toHaveLength(1);

    const closeBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(svc.messages()).toHaveLength(0);
    expect(svc.messages().find((m) => m.id === id)).toBeUndefined();
  });
});
