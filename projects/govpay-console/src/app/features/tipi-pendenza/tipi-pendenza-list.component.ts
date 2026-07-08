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
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfigService, ListStateService, SnackbarService, SystemFacade, TweaksRegistry, LanguageService } from '@linkit/shared-ui';
import {
  DataTableComponent,
  DisplayConfigLoader,
  EmptyStateComponent,
  LoadingComponent,
  InfiniteScrollDirective,
  ListStickyToolbarDirective,
  ItemListComponent,
  PageHeaderComponent,
  SearchPillComponent,
  SEARCH_PILL_DENSITY_OPTIONS,
  SEARCH_PILL_VARIANT_OPTIONS,
  VIEW_OPTIONS,
  columnsFromConfig,
  formatOrdinamento,
  initialSearchState,
  truncate,
  type ColumnDef,
  type SearchField,
  type SearchPillLabels,
  type SearchState,
  type SortEvent,
  type SortOption,
} from '@linkit/shared-ui';
import { problemDetail, sliceHasMore, type Slice } from '@core/models';
import { TipiPendenzaConsoleApi } from './tipi-pendenza.console-api';
import type { TipiPendenzaListFilters, TipoPendenzaSummary } from './tipo-pendenza.model';

const PAGE_SIZE = 25;

const F = {
  idTipoPendenza: 'idTipoPendenza',
  descrizione: 'descrizione',
  abilitato: 'abilitato',
} as const;

/** Valori del filtro `abilitato` (segmented). `Tutti` = nessun filtro. */
const ABIL = { tutti: 'Tutti', si: 'Abilitati', no: 'Disabilitati' } as const;

@Component({
  selector: 'lnk-tipi-pendenza-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    DataTableComponent,
    ItemListComponent,
    EmptyStateComponent,
    InfiniteScrollDirective,
    SearchPillComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipi-pendenza-list.component.html',
})
export class TipiPendenzaListComponent implements OnInit {
  private readonly api = inject(TipiPendenzaConsoleApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'tipi-pendenza';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['tipi-pendenza'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(() => this.viewModeOverride() ?? this.viewModeDefault());

  private readonly searchPillVariantOverride = signal<'pill' | 'square' | null>(null);
  readonly searchPillVariant = computed<'pill' | 'square'>(
    () => this.searchPillVariantOverride() ?? this.config.appConfig()?.Layout.searchPillVariant ?? 'pill'
  );

  private readonly searchPillDensityOverride = signal<'compact' | 'regular' | 'comfortable' | null>(null);
  readonly searchPillDensity = computed<'compact' | 'regular' | 'comfortable'>(
    () => this.searchPillDensityOverride() ?? this.config.appConfig()?.Layout.searchPillDensity ?? 'compact'
  );

  readonly searchFields = computed<SearchField[]>(() => {
    this.lang.current();
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: F.idTipoPendenza, label: t('TipiPendenza.Filters.IdTipoPendenza'), kind: 'text', placeholder: t('TipiPendenza.Filters.IdTipoPendenzaPlaceholder') },
      { id: F.descrizione, label: t('TipiPendenza.Filters.Descrizione'), kind: 'text', placeholder: t('TipiPendenza.Filters.DescrizionePlaceholder') },
      {
        id: F.abilitato,
        label: t('TipiPendenza.Filters.Stato'),
        kind: 'select',
        options: [ABIL.tutti, ABIL.si, ABIL.no],
        optionLabels: {
          [ABIL.tutti]: t('TipiPendenza.Filters.StatoTutti'),
          [ABIL.si]: t('TipiPendenza.Filters.StatoAbilitati'),
          [ABIL.no]: t('TipiPendenza.Filters.StatoDisabilitati'),
        },
        default: ABIL.tutti,
      },
    ];
  });

  readonly searchPlaceholder = computed(() => {
    this.lang.current();
    return this.translate.instant('TipiPendenza.Filters.Placeholder');
  });

  /** Campi di ordinamento supportati dall'API (`sort`: idTipoPendenza, descrizione). */
  readonly sortOptions = computed<SortOption[]>(() => {
    this.lang.current();
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: 'idTipoPendenza', label: t('TipiPendenza.Columns.IdTipoPendenza') },
      { id: 'descrizione', label: t('TipiPendenza.Columns.Descrizione') },
    ];
  });

  readonly pillLabels = computed<SearchPillLabels>(() => {
    this.lang.current();
    const t = (k: string) => this.translate.instant(k);
    return {
      filters: t('SearchPill.Filters'),
      reset: t('SearchPill.Reset'),
      close: t('SearchPill.Close'),
      search: t('SearchPill.Search'),
      activeSuffix: t('SearchPill.ActiveSuffix'),
      resultsApproxPrefix: t('SearchPill.ResultsApproxPrefix'),
      resultsSuffix: t('SearchPill.ResultsSuffix'),
      noResults: t('SearchPill.NoResults'),
      optionsFilter: t('SearchPill.OptionsFilter'),
      none: t('SearchPill.None'),
      noOptions: t('SearchPill.NoOptions'),
      textPlaceholder: t('SearchPill.TextPlaceholder'),
      selectPlaceholder: t('SearchPill.SelectPlaceholder'),
      allFieldsHint: t('SearchPill.AllFieldsHint'),
      sortBy: t('SearchPill.SortBy'),
      sortAsc: t('SearchPill.SortAsc'),
      sortDesc: t('SearchPill.SortDesc'),
    };
  });

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'tipi-pendenza',
        titleKey: 'Tweaks.Layout',
        rows: [
          {
            type: 'segmented',
            labelKey: 'Tweaks.View',
            hintKey: 'Tweaks.ViewHint',
            options: VIEW_OPTIONS,
            value: this.viewMode,
            onChange: (v) => this.onViewModeChange(v),
          },
          {
            type: 'segmented',
            labelKey: 'Tweaks.SearchPill',
            hintKey: 'Tweaks.SearchPillHint',
            options: SEARCH_PILL_VARIANT_OPTIONS,
            value: this.searchPillVariant,
            onChange: (v) => this.searchPillVariantOverride.set(v === 'square' ? 'square' : 'pill'),
          },
          {
            type: 'segmented',
            labelKey: 'Tweaks.Density',
            hintKey: 'Tweaks.DensityHint',
            options: SEARCH_PILL_DENSITY_OPTIONS,
            value: this.searchPillDensity,
            onChange: (v) => this.searchPillDensityOverride.set(v as 'compact' | 'regular' | 'comfortable'),
          },
        ],
        onReset: () => {
          this.viewModeOverride.set(null);
          this.searchPillVariantOverride.set(null);
          this.searchPillDensityOverride.set(null);
        },
      })
    );
  }

  readonly rowConfig = toSignal(
    this.displayConfigLoader.load('assets/config/tipi-pendenza-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'descrizione', direction: 'asc' });
  readonly rows = signal<TipoPendenzaSummary[]>([]);
  readonly hasMore = signal(false);
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchState = signal<SearchState>(initialSearchState([]));

  readonly hasActiveFilters = computed(() => {
    const f = this.searchState().filters;
    return !!(f[F.idTipoPendenza] || f[F.descrizione] || (f[F.abilitato] && f[F.abilitato] !== ABIL.tutti));
  });

  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(() => !this.loading() && !this.hasError() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<TipoPendenzaSummary>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<TipoPendenzaSummary>(tableCfg.columns);
    return [
      { key: 'idTipoPendenza', header: 'TipiPendenza.Columns.IdTipoPendenza', cellClass: 'font-mono text-xs', width: '12rem' },
      { key: 'descrizione', header: 'TipiPendenza.Columns.Descrizione', format: (t) => truncate(t.descrizione) },
      {
        key: 'abilitato',
        header: 'TipiPendenza.Columns.Abilitato',
        cellType: 'badge',
        cellTone: (t) => (t.abilitato ? 'success' : 'muted'),
        format: (t) => this.translate.instant(t.abilitato ? 'Common.Yes' : 'Common.No'),
        width: '8rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.TipiPendenza' }]);
    const saved = this.listState.get<{ search: SearchState; sort: SortEvent | null }>(TipiPendenzaListComponent.STATE_KEY);
    if (saved) {
      if (saved.search) this.searchState.set(saved.search);
      if (saved.sort) this.sort.set(saved.sort);
    }
    this.syncPillSort();
    this.reset();
  }

  /** Allinea sort/dir della search-pill al `sort` signal (dropdown ↔ tabella). */
  private syncPillSort(): void {
    const s = this.sort();
    this.searchState.update((v) => ({ ...v, sort: s?.key ?? '', dir: s?.direction ?? 'desc' }));
  }

  onSortChange(s: SortEvent): void {
    this.sort.set(s);
    this.syncPillSort();
    this.reset();
  }

  refresh(): void {
    this.reset();
  }

  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }

  onSearch(state: SearchState): void {
    this.searchState.set(state);
    // La search-pill può cambiare campo/direzione di ordinamento: rifletti nel sort della tabella.
    if (state.sort) this.sort.set({ key: state.sort, direction: state.dir });
    this.reset();
  }

  resetFilters(): void {
    this.searchState.set(initialSearchState(this.searchFields()));
    this.reset();
  }

  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  onRowClick(t: TipoPendenzaSummary): void {
    if (t.idTipoPendenza) this.router.navigate(['/tipi-pendenza', t.idTipoPendenza]);
  }

  private reset(): void {
    this.listState.set(TipiPendenzaListComponent.STATE_KEY, { search: this.searchState(), sort: this.sort() });
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.searchState().filters;
    const abil = f[F.abilitato];
    const filters: TipiPendenzaListFilters = {
      page: this.page(),
      limit: PAGE_SIZE,
      sort: formatOrdinamento(this.sort()),
      total: append ? undefined : true,
      idTipoPendenza: f[F.idTipoPendenza] || undefined,
      descrizione: f[F.descrizione] || undefined,
      abilitato: abil === ABIL.si ? true : abil === ABIL.no ? false : undefined,
    };

    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Slice<TipoPendenzaSummary>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const results = slice.results ?? [];
        if (append) this.rows.update((prev) => [...prev, ...results]);
        else this.rows.set(results);
        const totalResults = slice.pagination?.totalResults;
        if (totalResults != null) this.total.set(totalResults);
        this.hasMore.set(sliceHasMore(slice));
        this.loading.set(false);
      });
  }
}
