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

/**
 * Chip di filtro attivo rimovibile, es.  Stato: Attivo  (×)
 *
 *   <lnk-search-chip [label]="c.label" [value]="c.value" (remove)="drop(c.id)" />
 */
@Component({
  selector: 'lnk-search-chip',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip">
      <span class="chip__label">{{ label() }}:</span>
      <span class="chip__value">{{ value() }}</span>
      <button
        type="button"
        class="chip__remove"
        [attr.aria-label]="'Rimuovi ' + label()"
        (click)="remove.emit()"
      >
        <ng-icon name="bootstrapX" size="0.85rem" />
      </button>
    </span>
  `,
  styles: [`
    @keyframes chipIn {
      from { opacity: 0; transform: translateY(2px) scale(.96); }
      to   { opacity: 1; transform: none; }
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: var(--sb-chip-h);
      padding: 0 4px 0 10px;
      background: var(--sb-primary-soft);
      color: var(--sb-primary);
      border-radius: 999px;
      font-size: var(--sb-chip-fs);
      font-weight: 500;
      white-space: nowrap;
      animation: chipIn .18s ease-out;
    }
    .chip__label { opacity: .8; }
    .chip__value { font-weight: 600; }
    .chip__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      margin-left: 2px;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition: background .12s;
    }
    .chip__remove:hover { background: rgba(0, 0, 0, .06); }
  `],
})
export class SearchChipComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly remove = output<void>();
}
