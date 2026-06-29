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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemListComponent } from './item-list.component';
import type { DisplayConfig } from '../item-row/display-config.types';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

const ROWS = [
  { id: 'a', name: 'Alfa' },
  { id: 'b', name: 'Beta' },
];

const CONFIG: DisplayConfig = {
  itemRow: {
    primaryText: [{ type: 'text', field: 'name' }],
  },
};

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ItemListComponent);
  fixture.componentRef.setInput('rows', ROWS);
  fixture.componentRef.setInput('config', CONFIG);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('ItemListComponent', () => {
  beforeEach(() => {
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

  it('renderizza 1 <lnk-item-row> per ogni elemento di rows', () => {
    const fixture = render();
    const rows = fixture.nativeElement.querySelectorAll('lnk-item-row');
    expect(rows.length).toBe(2);
  });

  it("rows vuoto + loading=false: mostra <lnk-empty-state>", () => {
    const fixture = render({ rows: [] });
    expect(fixture.nativeElement.querySelector('lnk-empty-state')).toBeTruthy();
    expect(fixture.componentInstance['showEmpty']()).toBe(true);
  });

  it("rows vuoto + loading=true: niente empty-state", () => {
    const fixture = render({ rows: [], loading: true });
    expect(fixture.componentInstance['showEmpty']()).toBe(false);
  });

  it("rows con elementi: niente empty-state", () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('lnk-empty-state')).toBeNull();
  });

  it("hasRows: true se rows.length > 0", () => {
    const fixture = render();
    expect(fixture.componentInstance['hasRows']()).toBe(true);
  });

  it("rowClick emesso dal child <lnk-item-row> propaga al parent", () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);

    // Simula il click event interno richiamando direttamente onRowClick
    fixture.componentInstance['onRowClick'](ROWS[0]);
    expect(handler).toHaveBeenCalledWith(ROWS[0]);
  });

  it("selectedRow: isSelected ritorna true solo per la riga corrispondente", () => {
    const fixture = render({ selectedRow: ROWS[1] });
    expect(fixture.componentInstance['isSelected'](ROWS[0])).toBe(false);
    expect(fixture.componentInstance['isSelected'](ROWS[1])).toBe(true);
  });
});
