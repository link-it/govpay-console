/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { StatusBadgeComponent, type StatusTone } from '../status-badge/status-badge.component';
import { ItemTypeComponent } from '../item-type/item-type.component';
import type {
  DisplayConfig,
  ItemTypeElement,
  TableColumnConfig,
} from '../item-row/display-config.types';

/**
 * Definizione di una colonna della `DataTableComponent`.
 *
 * - `key`: nome del campo nell'oggetto riga (string per supportare path nested
 *   gestiti da `format`).
 * - `header`: chiave i18n per l'intestazione.
 * - `format`: per `cellType: 'text'` ritorna la stringa formattata; per
 *   `cellType: 'badge'` ritorna la **chiave i18n** della label.
 * - `cellType`: `'text'` (default) o `'badge'`.
 * - `cellTone`: per `cellType: 'badge'`, ritorna il tone (success/info/...).
 * - `cellClass`: classi CSS aggiuntive (es. `font-mono`).
 * - `align`: allineamento orizzontale.
 * - `sortable`: la colonna emette `sortChange` al click.
 * - `width`: larghezza CSS opzionale.
 */
export interface ColumnDef<T> {
  key: string;
  header: string;
  format?: (row: T) => string;
  cellType?: 'text' | 'badge';
  cellTone?: (row: T) => StatusTone;
  cellClass?: string;
  headerClass?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
  /**
   * Se `true` solo questa cella è il "trigger" del rowClick: viene
   * resa con cursor-pointer e hover evidenziato. La riga conserva
   * l'hover di sfondo ma non emette click. Se nessuna colonna ha
   * `link: true`, l'intera riga è cliccabile (modello classico).
   */
  link?: boolean;
  /**
   * Descrittore driven-by-config: se presente, la cella è renderizzata
   * tramite `<lnk-item-type>` (text/date/currency/status/badge/tag/icon/…).
   * Risolve `options` da `displayConfig` passata alla data-table.
   */
  cell?: ItemTypeElement;
}

/**
 * Mappa una `TableColumnConfig` (JSON) in `ColumnDef<T>` per
 * `<lnk-data-table>`. Il rendering della cella è delegato a
 * `<lnk-item-type>` tramite la proprietà `cell`.
 */
export function columnsFromConfig<T extends object>(cols: TableColumnConfig[]): ColumnDef<T>[] {
  return cols.map((c) => ({
    key: c.key ?? c.cell.field ?? c.cell.label ?? c.header,
    header: c.header,
    cellClass: c.cellClass,
    headerClass: c.headerClass,
    align: c.align,
    sortable: c.sortable,
    width: c.width,
    link: c.link ?? c.cell.link,
    cell: c.cell,
  }));
}

export interface SortEvent {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Tabella generica tipizzata.
 */
@Component({
  selector: 'lnk-data-table',
  standalone: true,
  imports: [NgIcon, TranslatePipe, StatusBadgeComponent, ItemTypeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
})
export class DataTableComponent<T extends object = object> {
  readonly columns = input.required<ColumnDef<T>[]>();
  readonly rows = input<T[]>([]);
  readonly loading = input<boolean>(false);
  readonly skeletonRows = input<number>(8);
  readonly emptyKey = input<string>('Common.NoResults');
  /** Se `true` (default) le righe emettono `rowClick` e hanno cursor pointer +
   *  hover. Impostare a `false` per liste read-only senza dettaglio. */
  readonly clickable = input<boolean>(true);
  readonly sort = input<SortEvent | null>(null);
  /** `DisplayConfig` opzionale: necessaria a `<lnk-item-type>` per
   *  risolvere `options` (status/label/tag) per le colonne driven-by-config. */
  readonly displayConfig = input<DisplayConfig | null>(null);

  readonly rowClick = output<T>();
  readonly sortChange = output<SortEvent>();

  readonly skeletonArray = computed(() => Array.from({ length: this.skeletonRows() }, (_, i) => i));

  /** Vero se almeno una colonna è marcata come `link`: in tal caso il
   *  click si attiva solo sulle celle marcate, non sulla riga. */
  readonly hasLinkCol = computed(() => this.columns().some((c) => c.link));

  cellValue(row: T, col: ColumnDef<T>): string {
    if (col.format) return col.format(row);
    const v = (row as Record<string, unknown>)[col.key];
    if (v === null || v === undefined) return '';
    return String(v);
  }

  cellTone(row: T, col: ColumnDef<T>): StatusTone {
    return col.cellTone?.(row) ?? 'muted';
  }

  alignClass(align: ColumnDef<T>['align']): string {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  }

  onHeaderClick(col: ColumnDef<T>): void {
    if (!col.sortable) return;
    const current = this.sort();
    const direction: 'asc' | 'desc' =
      current?.key === col.key && current.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: col.key, direction });
  }

  onRowClick(row: T): void {
    // Se ci sono colonne `link`, il click sulla riga è disabilitato:
    // l'evento è gestito dalle celle marcate (`onLinkClick`).
    if (this.clickable() && !this.hasLinkCol()) this.rowClick.emit(row);
  }

  onLinkClick(row: T, event: Event): void {
    event.stopPropagation();
    if (this.clickable()) this.rowClick.emit(row);
  }

  sortIcon(col: ColumnDef<T>): string {
    if (!col.sortable) return '';
    const s = this.sort();
    if (s?.key !== col.key) return 'bootstrapChevronUp';
    return s.direction === 'asc' ? 'bootstrapChevronUp' : 'bootstrapChevronDown';
  }

  isSorted(col: ColumnDef<T>): boolean {
    return this.sort()?.key === col.key;
  }
}
