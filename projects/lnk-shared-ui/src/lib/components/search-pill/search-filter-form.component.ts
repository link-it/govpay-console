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
  input,
  output,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SearchFieldComponent } from './search-field.component';
import {
  SearchField,
  SearchPillLabels,
  DEFAULT_LABELS,
} from './search-pill.types';

/**
 * Form filtri mostrato nel popover della pillola: griglia responsive di
 * `<lnk-search-field>` con header (conteggio attivi + reset) e footer
 * (conteggio risultati + Chiudi/Cerca). Guidato da `fields`.
 */
@Component({
  selector: 'lnk-search-filter-form',
  standalone: true,
  imports: [NgIcon, SearchFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form">
      <!-- Header -->
      <div class="form__head">
        <div class="form__title">
          <ng-icon name="bootstrapSliders2" size="0.9rem" />
          <span>{{ labels().filters }}</span>
          @if (activeCount() > 0) {
            <span class="form__badge">{{ activeCount() }} {{ labels().activeSuffix }}</span>
          }
        </div>
        @if (activeCount() > 0) {
          <button type="button" class="form__reset" (click)="reset.emit()">
            <ng-icon name="bootstrapX" size="0.75rem" /> {{ labels().reset }}
          </button>
        }
      </div>

      <!-- Griglia campi (il campo riservato 'query' vive nella pill bar, non qui) -->
      <div class="form__grid">
        @for (f of formFields(); track f.id) {
          <div [class.form__cell--full]="(f.span ?? 1) === 2">
            <lnk-search-field
              [field]="f"
              [labels]="labels()"
              [value]="fieldValue(f)"
              (valueChange)="onFieldChange(f.id, $event)"
            />
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="form__foot">
        <div class="form__count">
          @if (resultCount() != null) {
            <span>{{ labels().resultsApproxPrefix }} <b>{{ resultCount() }}</b> {{ labels().resultsSuffix }}</span>
          } @else {
            <span>I filtri si applicano a tutti i campi</span>
          }
        </div>
        <div class="form__actions">
          <button type="button" class="sbtn sbtn--ghost" (click)="close.emit()">{{ labels().close }}</button>
          <button type="button" class="sbtn sbtn--primary" (click)="search.emit()">
            <ng-icon name="bootstrapSearch" size="0.85rem" /> {{ labels().search }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 18px 20px 16px;
    }
    .form__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .form__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--sb-text);
    }
    .form__title ng-icon { color: var(--sb-text-muted); }
    .form__badge {
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--sb-primary);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }
    .form__reset {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      font: inherit;
      font-size: 12.5px;
      color: var(--sb-text-muted);
      cursor: pointer;
      transition: background .12s;
    }
    .form__reset:hover { background: var(--sb-chip); }

    .form__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .form__cell--full { grid-column: 1 / -1; }

    .form__foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 12px;
      margin-top: 2px;
      border-top: 1px solid var(--sb-border);
    }
    .form__count { font-size: 12.5px; color: var(--sb-text-muted); }
    .form__count b { color: var(--sb-text); }
    .form__actions { display: flex; align-items: center; gap: 8px; }

    .sbtn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 8px;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background .12s;
    }
    .sbtn--ghost {
      padding: 8px 14px;
      border: 1px solid var(--sb-border);
      background: var(--sb-surface);
      color: var(--sb-text);
      font-weight: 500;
    }
    .sbtn--ghost:hover { background: var(--sb-chip); }
    .sbtn--primary {
      padding: 9px 16px;
      border: none;
      background: var(--sb-primary);
      color: #fff;
    }
    .sbtn--primary:hover { background: var(--sb-primary-hover); }

    /* Mobile: griglia a colonna singola, padding ridotto, footer che va a capo. */
    @media (max-width: 640px) {
      .form { padding: 14px 14px 12px; gap: 12px; }
      .form__grid { grid-template-columns: 1fr; }
      .form__foot { flex-direction: column; align-items: stretch; gap: 10px; }
      .form__actions { justify-content: flex-end; }
      .sbtn { justify-content: center; }
    }
  `],
})
export class SearchFilterFormComponent {
  readonly fields = input.required<SearchField[]>();
  readonly filters = input.required<Record<string, string>>();
  readonly resultCount = input<number | null>(null);
  readonly labels = input<SearchPillLabels>(DEFAULT_LABELS);

  readonly filterChange = output<{ id: string; value: string }>();
  readonly reset = output<void>();
  readonly close = output<void>();
  readonly search = output<void>();

  /** `query` è l'input free-text della pillola — mai mostrato nel popover. */
  protected readonly formFields = computed(() =>
    this.fields().filter((f) => f.id !== 'query'),
  );

  protected readonly activeCount = computed(() => {
    const filters = this.filters();
    return this.formFields().reduce((n, f) => {
      const cur = filters[f.id] ?? f.default ?? '';
      const def = f.default ?? '';
      if (f.kind === 'text') return n + (cur ? 1 : 0);
      return n + (cur && cur !== def ? 1 : 0);
    }, 0);
  });

  /** Valore corrente del campo con fallback al default (chiave assente a runtime). */
  protected fieldValue(f: SearchField): string {
    return this.filters()[f.id] ?? f.default ?? '';
  }

  protected onFieldChange(id: string, value: string): void {
    this.filterChange.emit({ id, value });
  }
}
