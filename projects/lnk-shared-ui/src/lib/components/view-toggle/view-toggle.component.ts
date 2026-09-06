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

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

export type ListViewMode = 'table' | 'rows';

/**
 * `<lnk-view-toggle>` — toggle **solo icone** per la modalità di visualizzazione
 * di una lista: tabella (`bootstrapTable`) / righe (`bootstrapList`). Pensato per
 * stare accanto a `<lnk-search-pill>` così l'utente cambia vista senza aprire il
 * menu tweaks.
 *
 * Richiede che il consumer registri le icone `bootstrapTable` e `bootstrapList`
 * (`provideIcons`). La `variant` allinea gli angoli alla search-pill.
 *
 * ```html
 * <lnk-view-toggle [value]="viewMode()" (valueChange)="onViewModeChange($event)"
 *   [variant]="searchPillVariant()" />
 * ```
 */
@Component({
  selector: 'lnk-view-toggle',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lnk-view-toggle',
    role: 'group',
    '[class.lnk-view-toggle--square]': "variant() === 'square'",
  },
  template: `
    <button
      type="button"
      class="vt__btn"
      [class.vt__btn--on]="value() === 'table'"
      [attr.aria-pressed]="value() === 'table'"
      [title]="tableKey() | translate"
      [attr.aria-label]="tableKey() | translate"
      (click)="select('table')"
    >
      <ng-icon name="bootstrapTable" size="1rem" />
    </button>
    <button
      type="button"
      class="vt__btn"
      [class.vt__btn--on]="value() === 'rows'"
      [attr.aria-pressed]="value() === 'rows'"
      [title]="rowsKey() | translate"
      [attr.aria-label]="rowsKey() | translate"
      (click)="select('rows')"
    >
      <ng-icon name="bootstrapList" size="1.1rem" />
    </button>
  `,
  styles: [`
    :host {
      /* Si stira all'altezza della riga (= altezza della search-pill affiancata)
         così l'allineamento regge a ogni densità; con un min sensato da solo. */
      display: inline-flex;
      align-items: stretch;
      min-height: 2.25rem;
      gap: 2px;
      /* 5px verticali: con l'host stirato all'altezza della pill, i pulsanti
         icona risultano alti come il pulsante "Filtri" della search-pill
         (pillH − 12) a qualsiasi densità. */
      padding: 5px 4px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--card-bg);
      box-sizing: border-box;
    }
    :host(.lnk-view-toggle--square) { border-radius: 0.5rem; }

    .vt__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
    }
    :host(.lnk-view-toggle--square) .vt__btn { border-radius: 0.375rem; }
    .vt__btn:hover {
      color: var(--foreground);
      background: var(--muted);
    }
    .vt__btn--on,
    .vt__btn--on:hover {
      background: var(--primary);
      color: #fff;
    }
  `],
})
export class ViewToggleComponent {
  /** Modalità corrente. */
  readonly value = input<ListViewMode>('table');
  /** Allinea gli angoli alla variante della search-pill. */
  readonly variant = input<'pill' | 'square'>('pill');
  /** Chiavi i18n dei tooltip/aria-label. */
  readonly tableKey = input<string>('Tweaks.View.Table');
  readonly rowsKey = input<string>('Tweaks.View.Rows');
  /** Emesso al cambio effettivo di modalità. */
  readonly valueChange = output<ListViewMode>();

  protected select(v: ListViewMode): void {
    if (v !== this.value()) this.valueChange.emit(v);
  }
}
