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
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SearchChipComponent } from './search-chip.component';
import { SearchFilterFormComponent } from './search-filter-form.component';
import { SearchSuggestionsComponent } from './search-suggestions.component';
import {
  ActiveChip,
  Density,
  SearchField,
  SearchPillLabels,
  SearchState,
  SortOption,
  Suggestion,
  SuggestionGroupLabels,
  DEFAULT_LABELS,
  DEFAULT_SUGGESTION_GROUP_LABELS,
  computeActiveChips,
  initialSearchState,
} from './search-pill.types';
import { DENSITY_TOKENS } from './search-pill.tokens';

/**
 * `<lnk-search-pill>` — barra di ricerca "a pillola" flottante con chip dei
 * filtri attivi inline, toggle di ordinamento integrato, dropdown autocomplete
 * e popover filtri. Interamente config-driven via `fields`, così una sola
 * istanza serve qualsiasi contesto (Pendenze, Soggetti, …).
 *
 * Colori e superfici derivano dalle **variabili di tema** globali
 * (`--primary`, `--card-bg`, …): il dark mode segue automaticamente `.dark`.
 *
 * ```html
 * <lnk-search-pill
 *   [fields]="fields"
 *   [sortOptions]="sortOptions"
 *   [(value)]="state"
 *   [resultCount]="total()"
 *   density="regular"
 *   (search)="runSearch($event)" />
 * ```
 */
@Component({
  selector: 'lnk-search-pill',
  standalone: true,
  imports: [
    NgIcon,
    SearchChipComponent,
    SearchFilterFormComponent,
    SearchSuggestionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'hostStyle()',
    class: 'sb-host',
  },
  template: `
    <div class="pill-wrap">
      <!-- Pill bar -->
      <div class="pill" [attr.data-focus]="focused() ? '1' : '0'">
        <ng-icon name="bootstrapSearch" size="1.125rem" class="pill__lead" />

        <!-- Chip dei filtri attivi inline -->
        @if (chips().length) {
          <div class="pill__chips">
            @for (c of chips(); track c.id) {
              <lnk-search-chip [label]="c.label" [value]="c.value" (remove)="removeChip(c.id)" />
            }
          </div>
        }

        <!-- Query di testo libero (solo se è configurato un campo 'query') -->
        @if (hasQueryField()) {
          <input
            type="text"
            class="pill__input"
            [value]="value().query"
            [placeholder]="placeholder()"
            (input)="onQueryInput($any($event.target).value)"
            (focus)="onQueryFocus()"
            (blur)="onQueryBlur()"
            (keydown.enter)="onEnter()"
          />
        } @else {
          <!-- Senza query libera: l'area centrale apre il popover filtri. -->
          <button type="button" class="pill__input pill__input--btn" (click)="toggleFilters()">
            {{ placeholder() }}
          </button>
        }

        <!-- Toggle ordinamento inline -->
        @if (showSort() && sortOptions().length) {
          <button type="button" class="pill__sort" (click)="toggleDir()">
            <ng-icon [name]="value().dir === 'asc' ? 'bootstrapChevronUp' : 'bootstrapChevronDown'" size="0.8rem" />
            {{ activeSort()?.label }}
          </button>
          <span class="pill__divider"></span>
        }

        <!-- Trigger filtri -->
        <button type="button" class="pill__filters" [class.pill__filters--on]="showFilters()"
          (click)="toggleFilters()">
          <ng-icon name="bootstrapSliders2" size="0.9rem" />
          {{ labels().filters }}
          @if (chips().length) {
            <span class="pill__count">{{ chips().length }}</span>
          }
        </button>
      </div>

      <!-- Autocomplete -->
      @if (showSuggest() && !showFilters() && hasSuggestions()) {
        <div class="pill__pop pill__pop--suggest">
          <lnk-search-suggestions
            [items]="suggestions()"
            [query]="value().query"
            [groupLabels]="suggestionGroupLabels()"
            (pick)="pickSuggestion($event)"
          />
        </div>
      }

      <!-- Popover filtri -->
      @if (showFilters()) {
        <div class="pill__pop pill__pop--filters">
          <lnk-search-filter-form
            [fields]="fields()"
            [filters]="draft()"
            [resultCount]="resultCount()"
            [labels]="labels()"
            (filterChange)="onFilterChange($event.id, $event.value)"
            (reset)="resetFilters()"
            (close)="closeFilters()"
            (search)="applyFilters()"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; color: var(--sb-text); }

    @keyframes popIn {
      from { opacity: 0; transform: translateY(-4px) scale(.99); }
      to   { opacity: 1; transform: none; }
    }

    .pill-wrap { position: relative; }

    .pill {
      display: flex;
      align-items: center;
      gap: 10px;
      height: var(--sb-pill-h);
      padding: 0 6px 0 18px;
      background: var(--sb-surface);
      border: 1px solid var(--sb-border);
      border-radius: 999px;
      box-shadow: 0 6px 20px rgba(16, 24, 40, .06);
      transition: border-color .15s, box-shadow .15s;
    }
    .pill[data-focus='1'] {
      border-color: var(--sb-primary);
      box-shadow: 0 0 0 4px var(--sb-primary-soft), 0 6px 20px rgba(16, 24, 40, .06);
    }
    .pill__lead { color: var(--sb-text-muted); flex-shrink: 0; }

    .pill__chips {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .pill__input {
      flex: 1;
      min-width: 100px;
      border: none;
      outline: none;
      background: transparent;
      font: inherit;
      font-size: var(--sb-fs);
      color: var(--sb-text);
    }
    .pill__input::placeholder { color: var(--sb-text-subtle); }
    button.pill__input--btn {
      text-align: left;
      cursor: pointer;
      color: var(--sb-text-subtle);
    }

    .pill__sort {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: calc(var(--sb-pill-h) - 12px);
      padding: 0 10px;
      border: none;
      border-radius: 999px;
      background: transparent;
      font: inherit;
      font-size: 12.5px;
      color: var(--sb-text-muted);
      cursor: pointer;
      transition: background .12s, color .12s;
    }
    .pill__sort:hover { background: var(--sb-chip); color: var(--sb-text); }

    .pill__divider {
      width: 1px;
      height: calc(var(--sb-pill-h) - 18px);
      background: var(--sb-border);
    }

    .pill__filters {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: calc(var(--sb-pill-h) - 12px);
      padding: 0 14px;
      border: none;
      border-radius: 999px;
      background: var(--sb-chip);
      color: var(--sb-text);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background .12s, color .12s;
    }
    .pill__filters:hover { background: var(--sb-chip-hover); }
    .pill__filters--on,
    .pill__filters--on:hover {
      background: var(--sb-primary);
      color: #fff;
    }
    .pill__count {
      padding: 0 6px;
      border-radius: 999px;
      background: var(--sb-primary);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }
    .pill__filters--on .pill__count { background: rgba(255, 255, 255, .25); }

    .pill__pop {
      position: absolute;
      top: calc(var(--sb-pill-h) + 8px);
      z-index: 20;
      animation: popIn .14s ease-out;
    }
    .pill__pop--suggest { left: 18px; right: 18px; }
    .pill__pop--filters {
      left: 0;
      right: 0;
      background: var(--sb-surface);
      border: 1px solid var(--sb-border);
      border-radius: 16px;
      box-shadow: var(--sb-shadow-lg);
      overflow: hidden;
    }
  `],
})
export class SearchPillComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  // ── Config inputs ────────────────────────────────────────────────
  /** Definizione del form filtri. Guida popover, chip e chiavi autocomplete. */
  readonly fields = input.required<SearchField[]>();
  /** Opzioni di ordinamento mostrate dal toggle sort inline. */
  readonly sortOptions = input<SortOption[]>([]);
  /** Righe autocomplete. Vuoto = dropdown suggerimenti disabilitato. */
  readonly suggestions = input<Suggestion[]>([]);
  /** Conteggio risultati live nel footer del popover (null lo nasconde). */
  readonly resultCount = input<number | null>(null);
  /** Placeholder della query di testo libero. */
  readonly placeholder = input('Cerca…');

  // ── Theming ──────────────────────────────────────────────────────
  readonly density = input<Density>('regular');
  /** Mostra il toggle sort inline. */
  readonly showSort = input(true);

  // ── i18n ─────────────────────────────────────────────────────────
  readonly labels = input<SearchPillLabels>(DEFAULT_LABELS);
  readonly suggestionGroupLabels = input<SuggestionGroupLabels>(DEFAULT_SUGGESTION_GROUP_LABELS);

  // ── Two-way state ────────────────────────────────────────────────
  /** Stato completo di ricerca — bind con `[(value)]`. */
  readonly value = model<SearchState>(initialSearchState([]));

  // ── Outputs ──────────────────────────────────────────────────────
  /** Emesso su Invio o sul bottone "Cerca" del popover. */
  readonly search = output<SearchState>();
  /** Emesso quando l'utente sceglie un suggerimento autocomplete. */
  readonly suggestionPick = output<Suggestion>();

  // ── UI state ─────────────────────────────────────────────────────
  protected readonly focused = signal(false);
  protected readonly showSuggest = signal(false);
  protected readonly showFilters = signal(false);
  /**
   * Bozza dei filtri modificata nel popover mentre è aperto. Viene inizializzata
   * dallo stato committato all'apertura, aggiornata dai campi/reset, e committata
   * solo con "Cerca". Chiudere (Annulla/fuori-click) la scarta → riaprendo si
   * ripristinano i valori committati.
   */
  protected readonly draft = signal<Record<string, string>>({});

  // ── Derived ──────────────────────────────────────────────────────
  /** `true` se il config include un campo di ricerca libera (id `query`). */
  protected readonly hasQueryField = computed(() =>
    this.fields().some((f) => f.id === 'query'),
  );

  protected readonly chips = computed<ActiveChip[]>(() =>
    computeActiveChips(this.fields(), this.value().filters),
  );

  protected readonly activeSort = computed(() => {
    const s = this.value();
    return this.sortOptions().find((o) => o.id === s.sort) ?? this.sortOptions()[0];
  });

  protected readonly hasSuggestions = computed(() => this.suggestions().length > 0);

  /** CSS custom properties dell'host: sizing (densità) + mappa token→tema. */
  protected readonly hostStyle = computed(() => {
    const d = DENSITY_TOKENS[this.density()];
    const pillH = d.h + 8;
    return [
      // Colori/superfici → variabili di tema (dark automatico via `.dark`).
      '--sb-primary:var(--primary)',
      '--sb-primary-hover:var(--lnk-btn-primary-hover)',
      '--sb-primary-soft:color-mix(in srgb, var(--primary) 12%, transparent)',
      '--sb-surface:var(--card-bg)',
      '--sb-surface-muted:var(--muted)',
      '--sb-border:var(--border)',
      '--sb-border-strong:var(--card-border)',
      '--sb-text:var(--foreground)',
      '--sb-text-muted:var(--muted-foreground)',
      '--sb-text-subtle:var(--muted-foreground)',
      '--sb-chip:var(--muted)',
      '--sb-chip-hover:var(--card-hover)',
      '--sb-shadow-lg:0 4px 8px rgba(16,24,40,.04), 0 24px 48px -12px rgba(16,24,40,.18)',
      // Sizing per densità.
      `--sb-pill-h:${pillH}px`,
      `--sb-fs:${d.fs}px`,
      `--sb-chip-h:${d.chipH}px`,
      `--sb-chip-fs:${d.chipFs}px`,
    ].join(';');
  });

  // ── Query handlers ───────────────────────────────────────────────
  protected onQueryInput(text: string): void {
    this.patch({ query: text });
    this.showSuggest.set(this.hasSuggestions());
  }

  protected onQueryFocus(): void {
    this.focused.set(true);
    this.showSuggest.set(this.hasSuggestions());
  }

  protected onQueryBlur(): void {
    this.focused.set(false);
    // Deferred so a suggestion click registers before we hide the list.
    setTimeout(() => this.showSuggest.set(false), 120);
  }

  protected onEnter(): void {
    this.showSuggest.set(false);
    this.search.emit(this.value());
  }

  // ── Sort ─────────────────────────────────────────────────────────
  protected toggleDir(): void {
    this.patch({ dir: this.value().dir === 'asc' ? 'desc' : 'asc' });
  }

  // ── Filters popover ──────────────────────────────────────────────
  protected toggleFilters(): void {
    if (this.showFilters()) this.closeFilters();
    else this.openFilters();
  }

  /** Apre il popover inizializzando la bozza dallo stato committato. */
  protected openFilters(): void {
    this.draft.set({ ...this.value().filters });
    this.showFilters.set(true);
    this.showSuggest.set(false);
  }

  /** Chiude il popover **scartando** la bozza (nessun commit). */
  protected closeFilters(): void {
    this.showFilters.set(false);
  }

  /** Modifica un campo della **bozza** (non ancora committata). */
  protected onFilterChange(id: string, value: string): void {
    this.draft.update((d) => ({ ...d, [id]: value }));
  }

  /** Svuota la **bozza** ai default (la ricerca parte solo con "Cerca"). */
  protected resetFilters(): void {
    const filters: Record<string, string> = {};
    for (const f of this.fields()) {
      if (f.id === 'query') continue;
      filters[f.id] = f.default ?? '';
    }
    this.draft.set(filters);
  }

  /** Committa la bozza nello stato, chiude e lancia la ricerca. */
  protected applyFilters(): void {
    this.patch({ filters: { ...this.draft() } });
    this.showFilters.set(false);
    this.search.emit(this.value());
  }

  /** Rimuove un chip dalla barra: aggiorna lo stato committato e **cerca subito**. */
  protected removeChip(id: string): void {
    const field = this.fields().find((f) => f.id === id);
    this.patch({ filters: { ...this.value().filters, [id]: field?.default ?? '' } });
    this.search.emit(this.value());
  }

  // ── Suggestions ──────────────────────────────────────────────────
  protected pickSuggestion(s: Suggestion): void {
    this.patch({ query: s.label });
    this.showSuggest.set(false);
    this.suggestionPick.emit(s);
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private patch(part: Partial<SearchState>): void {
    this.value.update((v) => ({ ...v, ...part }));
  }

  @HostListener('document:mousedown', ['$event'])
  onDocDown(e: MouseEvent): void {
    if (this.showFilters() && !this.host.nativeElement.contains(e.target)) {
      this.showFilters.set(false);
    }
  }
}
