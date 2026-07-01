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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { ItemTypeComponent } from '../item-type/item-type.component';
import { getBoxOptionStyle } from '../../utils';
import type {
  BoxStatusConfig,
  DisplayConfig,
  ItemRowConfig,
  ItemRowLinkSection,
} from './display-config.types';

/**
 * Riga driven-by-config — alternativa alla riga di `<lnk-data-table>`.
 * Adattata da `ui-item-row` di GovHub:
 *   - avatar | colonna principale (titolo + metadata) | colonna secondaria | box di stato 1/2
 *   - footer top + bottom configurabili
 *
 * Esempio:
 * ```html
 * <lnk-item-row [data]="row" [config]="myConfig" (rowClick)="goTo($event)" />
 * ```
 */
@Component({
  selector: 'lnk-item-row',
  standalone: true,
  imports: [NgStyle, ItemTypeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-row.component.html',
})
export class ItemRowComponent {
  /** Dato della riga (può essere wrappato in `{ source }`). */
  readonly data = input.required<Record<string, unknown>>();
  /** `DisplayConfig` con varianti `itemRow` / `simpleItem` / opzioni. */
  readonly config = input.required<DisplayConfig>();
  /** Quale variante usare (default `itemRow`). */
  readonly configRow = input<string>('itemRow');
  /** True per applicare hover/cursor pointer. */
  readonly clickable = input<boolean>(true);
  /** Item selezionato (sfondo evidenziato). */
  readonly selected = input<boolean>(false);
  /** Notifica visiva (es. nuova riga in arrivo). */
  readonly notify = input<boolean>(false);

  readonly rowClick = output<Record<string, unknown>>();

  /** Sorgente "appiattita" del data (`data.source ?? data`). */
  protected readonly source = computed(() => {
    const d = this.data();
    return (d as { source?: unknown }).source ?? d;
  });

  /** Variante di config selezionata (`itemRow`, `simpleItem`, …). */
  protected readonly rowConfig = computed<ItemRowConfig | null>(() => {
    const cfg = this.config();
    const key = this.configRow();
    return (cfg[key] as ItemRowConfig | undefined) ?? cfg.itemRow ?? cfg.simpleItem ?? null;
  });

  /**
   * Sezione cliccabile risolta:
   * - se un singolo `ItemTypeElement` ha `link: true`, vince la sua sezione;
   * - altrimenti `rowConfig.linkSection`;
   * - default `'primaryText'`.
   */
  protected readonly linkSection = computed<ItemRowLinkSection>(() => {
    const cfg = this.rowConfig();
    if (!cfg) return 'primaryText';
    if (cfg.primaryText?.some((e) => e.link)) return 'primaryText';
    if (cfg.secondaryText?.some((e) => e.link)) return 'secondaryText';
    if (cfg.avatar?.link) return 'avatar';
    return cfg.linkSection ?? 'primaryText';
  });

  protected boxStyle(box: BoxStatusConfig | undefined): { background: string; color: string } {
    return getBoxOptionStyle(this.source(), box, this.config().options);
  }

  protected onClick(event: Event): void {
    if (!this.clickable()) return;
    event.stopPropagation();
    this.rowClick.emit(this.data());
  }
}
