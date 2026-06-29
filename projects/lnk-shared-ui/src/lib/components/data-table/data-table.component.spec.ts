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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTableComponent, columnsFromConfig, type ColumnDef, type SortEvent } from './data-table.component';
import type { TableColumnConfig } from '../item-row/display-config.types';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

interface Row {
  id: string;
  nome: string;
  importo: number;
  stato: string;
}

const ROWS: Row[] = [
  { id: 'a', nome: 'Alfa', importo: 100, stato: 'OK' },
  { id: 'b', nome: 'Beta', importo: 200, stato: 'KO' },
];

const COLS: ColumnDef<Row>[] = [
  { key: 'nome', header: 'Col.Nome', sortable: true },
  { key: 'importo', header: 'Col.Importo', align: 'right', format: (r) => `€ ${r.importo}` },
  { key: 'stato', header: 'Col.Stato', cellType: 'badge', cellTone: () => 'success' },
];

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(DataTableComponent);
  fixture.componentRef.setInput('columns', COLS);
  fixture.componentRef.setInput('rows', ROWS);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('DataTableComponent', () => {
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

  it('renderizza 1 <thead> + 1 row per ogni elemento di rows', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelectorAll('thead tr').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('cellValue usa format() se presente, altrimenti il campo raw', () => {
    const cmp = TestBed.createComponent(DataTableComponent).componentInstance as DataTableComponent<Row>;
    expect(cmp.cellValue(ROWS[0], COLS[0])).toBe('Alfa'); // no format
    expect(cmp.cellValue(ROWS[0], COLS[1])).toBe('€ 100'); // format
  });

  it('cellValue: null/undefined diventa stringa vuota', () => {
    const cmp = TestBed.createComponent(DataTableComponent).componentInstance as DataTableComponent<Row>;
    const col: ColumnDef<Row> = { key: 'missing', header: 'X' };
    expect(cmp.cellValue({ id: '', nome: '', importo: 0, stato: '' }, col)).toBe('');
  });

  it("alignClass mappa 'left/center/right'", () => {
    const cmp = TestBed.createComponent(DataTableComponent).componentInstance as DataTableComponent<Row>;
    expect(cmp.alignClass('center')).toBe('text-center');
    expect(cmp.alignClass('right')).toBe('text-right');
    expect(cmp.alignClass('left')).toBe('text-left');
    expect(cmp.alignClass(undefined)).toBe('text-left');
  });

  it("loading=true mostra le skeleton row (default 8)", () => {
    const fixture = render({ rows: [], loading: true });
    // Quando loading lo skeleton sostituisce le righe (assumendo template skeleton)
    // verifichiamo almeno che non ci siano le 2 righe e che `skeletonArray` sia popolato.
    expect(fixture.componentInstance.skeletonArray().length).toBe(8);
  });

  it("skeletonRows custom configura il numero", () => {
    const fixture = render({ rows: [], loading: true, skeletonRows: 3 });
    expect(fixture.componentInstance.skeletonArray().length).toBe(3);
  });

  it("hasLinkCol: true se almeno una colonna ha link=true", () => {
    const fixture = render({ columns: [{ key: 'nome', header: 'H', link: true }] });
    expect(fixture.componentInstance.hasLinkCol()).toBe(true);
  });

  it("hasLinkCol: false con colonne standard", () => {
    const fixture = render();
    expect(fixture.componentInstance.hasLinkCol()).toBe(false);
  });

  it("onHeaderClick: prima click → asc, seconda → desc", () => {
    const fixture = render();
    const emitted: SortEvent[] = [];
    fixture.componentInstance.sortChange.subscribe((e) => emitted.push(e));

    fixture.componentInstance.onHeaderClick(COLS[0]);
    expect(emitted[0]).toEqual({ key: 'nome', direction: 'asc' });

    // Simulazione del consumer che setta back il sort: setInput
    fixture.componentRef.setInput('sort', { key: 'nome', direction: 'asc' });
    fixture.componentInstance.onHeaderClick(COLS[0]);
    expect(emitted[1]).toEqual({ key: 'nome', direction: 'desc' });
  });

  it("onHeaderClick su colonna non sortable: no emit", () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.sortChange.subscribe(handler);
    fixture.componentInstance.onHeaderClick(COLS[1]); // sortable: false
    expect(handler).not.toHaveBeenCalled();
  });

  it("sortIcon: chevron-up se non sorted o asc, chevron-down se desc", () => {
    const fixture = render();
    expect(fixture.componentInstance.sortIcon(COLS[0])).toBe('bootstrapChevronUp');
    fixture.componentRef.setInput('sort', { key: 'nome', direction: 'desc' });
    expect(fixture.componentInstance.sortIcon(COLS[0])).toBe('bootstrapChevronDown');
  });

  it("sortIcon: stringa vuota se colonna non sortable", () => {
    const fixture = render();
    expect(fixture.componentInstance.sortIcon(COLS[1])).toBe('');
  });

  it("isSorted: true solo per la colonna che corrisponde a sort.key", () => {
    const fixture = render({ sort: { key: 'nome', direction: 'asc' } as SortEvent });
    expect(fixture.componentInstance.isSorted(COLS[0])).toBe(true);
    expect(fixture.componentInstance.isSorted(COLS[1])).toBe(false);
  });

  it("onRowClick emette rowClick se clickable e niente colonna link", () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);
    fixture.componentInstance.onRowClick(ROWS[0]);
    expect(handler).toHaveBeenCalledWith(ROWS[0]);
  });

  it("onRowClick non emette se clickable=false", () => {
    const fixture = render({ clickable: false });
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);
    fixture.componentInstance.onRowClick(ROWS[0]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("onRowClick non emette se c'è una colonna link (handover alle celle)", () => {
    const fixture = render({ columns: [{ ...COLS[0], link: true }, COLS[1]] });
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);
    fixture.componentInstance.onRowClick(ROWS[0]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("onLinkClick emette rowClick e stop propagation", () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);
    const event = { stopPropagation: vi.fn() } as unknown as Event;
    fixture.componentInstance.onLinkClick(ROWS[0], event);
    expect(handler).toHaveBeenCalledWith(ROWS[0]);
    expect((event.stopPropagation as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });
});

describe('columnsFromConfig()', () => {
  it("mappa TableColumnConfig in ColumnDef preservando link/cell/header/...", () => {
    const cfg: TableColumnConfig[] = [
      {
        key: 'idA2A',
        header: 'Col.A2A',
        cellClass: 'font-mono',
        link: true,
        cell: { type: 'text', field: 'idA2A' },
      },
    ];
    const cols = columnsFromConfig(cfg);
    expect(cols).toHaveLength(1);
    expect(cols[0].key).toBe('idA2A');
    expect(cols[0].header).toBe('Col.A2A');
    expect(cols[0].link).toBe(true);
    expect(cols[0].cell?.type).toBe('text');
  });

  it("fallback per key: cell.field → cell.label → header", () => {
    const cols = columnsFromConfig([
      { header: 'H', cell: { type: 'text', field: 'fieldA' } },
      { header: 'H2', cell: { type: 'label', label: 'labelB', options: 'X' } },
    ]);
    expect(cols[0].key).toBe('fieldA');
    expect(cols[1].key).toBe('labelB');
  });
});
