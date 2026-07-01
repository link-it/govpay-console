/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
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
  input,
  output,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  Suggestion,
  SuggestionGroupLabels,
  DEFAULT_SUGGESTION_GROUP_LABELS,
} from './search-pill.types';

/**
 * Dropdown autocomplete: filtra i `suggestions` per la query corrente e li
 * raggruppa in Recenti / Salvate / Suggerimenti.
 */
@Component({
  selector: 'lnk-search-suggestions',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sug">
      @for (g of groups(); track g.key) {
        @if (g.items.length) {
          <div class="sug__group">
            <div class="sug__head">{{ g.title }}</div>
            @for (s of g.items; track s.label) {
              <button type="button" class="sug__item"
                (mousedown)="$event.preventDefault()" (click)="pick.emit(s)">
                @if (s.icon) { <ng-icon [name]="s.icon" size="0.95rem" /> }
                <span class="sug__label">{{ s.label }}</span>
                @if (s.meta) { <span class="sug__meta">{{ s.meta }}</span> }
              </button>
            }
          </div>
        }
      }
      @if (isEmpty()) {
        <div class="sug__empty">Nessun suggerimento per "{{ query() }}"</div>
      }
    </div>
  `,
  styles: [`
    .sug {
      padding: 6px;
      background: var(--sb-surface);
      border: 1px solid var(--sb-border);
      border-radius: 12px;
      box-shadow: var(--sb-shadow-lg);
      overflow: hidden;
    }
    .sug__group { padding: 6px 0; }
    .sug__head {
      padding: 4px 12px 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--sb-text-subtle);
    }
    .sug__item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      font: inherit;
      text-align: left;
      cursor: pointer;
      color: var(--sb-text-muted);
    }
    .sug__item:hover { background: var(--sb-chip); }
    .sug__label { flex: 1; font-size: 14px; color: var(--sb-text); }
    .sug__meta { font-size: 12px; color: var(--sb-text-subtle); }
    .sug__empty {
      padding: 24px 12px;
      text-align: center;
      color: var(--sb-text-subtle);
      font-size: 13px;
    }
  `],
})
export class SearchSuggestionsComponent {
  readonly items = input.required<Suggestion[]>();
  readonly query = input('');
  readonly groupLabels = input<SuggestionGroupLabels>(DEFAULT_SUGGESTION_GROUP_LABELS);
  readonly pick = output<Suggestion>();

  private readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return q ? this.items().filter((s) => s.label.toLowerCase().includes(q)) : this.items();
  });

  protected readonly groups = computed(() => {
    const f = this.filtered();
    const l = this.groupLabels();
    return [
      { key: 'recent', title: l.recent, items: f.filter((s) => s.kind === 'recent') },
      { key: 'saved', title: l.saved, items: f.filter((s) => s.kind === 'saved') },
      { key: 'suggest', title: l.suggest, items: f.filter((s) => s.kind === 'suggest') },
    ];
  });

  protected readonly isEmpty = computed(() => this.filtered().length === 0);
}
