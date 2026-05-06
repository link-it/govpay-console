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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ItemRowComponent } from '../item-row/item-row.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import type { DisplayConfig } from '../item-row/display-config.types';

/**
 * Lista driven-by-config — alternativa a `<lnk-data-table>`.
 *
 * Stessa interfaccia di alto livello (rows, loading, rowClick),
 * ma rendering basato su `DisplayConfig` (avatar, primaryText, status,
 * boxStatus, footer) invece che sulle colonne tabellari.
 *
 * Uso tipico:
 * ```html
 * <lnk-item-list
 *   [rows]="rows()"
 *   [config]="rowConfig"
 *   [loading]="loading()"
 *   emptyKey="Pendenze.Empty.Title"
 *   (rowClick)="goToDetail($event)" />
 * ```
 *
 * Lo `<lnk-empty-state>` viene mostrato solo quando non ci sono righe e non è
 * in caricamento. L'infinite scroll resta esterno (le liste lo gestiscono già).
 */
@Component({
  selector: 'lnk-item-list',
  standalone: true,
  imports: [TranslatePipe, ItemRowComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-list.component.html',
})
export class ItemListComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly rows = input.required<T[]>();
  readonly config = input.required<DisplayConfig>();
  readonly configRow = input<string>('itemRow');
  readonly loading = input<boolean>(false);
  /** Chiave i18n del titolo dell'empty state. */
  readonly emptyKey = input<string>('Common.NoResults');
  /** Chiave i18n della descrizione dell'empty state (opzionale). */
  readonly emptyDescriptionKey = input<string | undefined>(undefined);
  /** Icona dell'empty state. */
  readonly emptyIcon = input<string>('bootstrapInboxes');
  /** Identifica una riga come "selezionata" (sfondo evidenziato). */
  readonly selectedRow = input<T | null>(null);
  /**
   * Mostra l'indicatore "Caricamento…" interno quando `loading=true` e non
   * ci sono ancora righe. Default `false`: la convenzione del progetto è
   * avere il loader esterno (es. trailing del `lnkInfiniteScroll`), così
   * si evitano doppi indicatori sulla stessa pagina.
   */
  readonly showInternalLoading = input<boolean>(false);

  readonly rowClick = output<T>();

  protected readonly hasRows = computed(() => this.rows().length > 0);
  protected readonly showEmpty = computed(() => !this.loading() && !this.hasRows());

  protected isSelected(row: T): boolean {
    const sel = this.selectedRow();
    return sel === row;
  }

  protected onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row as T);
  }
}
