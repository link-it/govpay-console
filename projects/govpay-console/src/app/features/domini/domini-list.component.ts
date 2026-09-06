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
  ViewToggleComponent,
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
import { DominiConsoleApi } from './domini.console-api';
import type { DominiListFilters, DominioSummary } from './dominio.model';

const PAGE_SIZE = 25;

const F = {
  idDominio: 'idDominio',
  ragioneSociale: 'ragioneSociale',
  abilitato: 'abilitato',
} as const;

/** Valori del filtro `abilitato` (segmented). `Tutti` = nessun filtro. */
const ABIL = { tutti: 'Tutti', si: 'Abilitati', no: 'Disabilitati' } as const;

@Component({
  selector: 'lnk-domini-list',
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
    ViewToggleComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './domini-list.component.html',
})
export class DominiListComponent implements OnInit {
  private readonly api = inject(DominiConsoleApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'domini';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['domini'] ?? layout?.listView ?? 'table';
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
      { id: F.idDominio, label: t('Domini.Filters.IdDominio'), kind: 'text', placeholder: t('Domini.Filters.IdDominioPlaceholder') },
      { id: F.ragioneSociale, label: t('Domini.Filters.RagioneSociale'), kind: 'text', placeholder: t('Domini.Filters.RagioneSocialePlaceholder') },
      {
        id: F.abilitato,
        label: t('Domini.Filters.Stato'),
        kind: 'select',
        options: [ABIL.tutti, ABIL.si, ABIL.no],
        optionLabels: {
          [ABIL.tutti]: t('Domini.Filters.StatoTutti'),
          [ABIL.si]: t('Domini.Filters.StatoAbilitati'),
          [ABIL.no]: t('Domini.Filters.StatoDisabilitati'),
        },
        default: ABIL.tutti,
      },
    ];
  });

  readonly searchPlaceholder = computed(() => {
    this.lang.current();
    return this.translate.instant('Domini.Filters.Placeholder');
  });

  /** Campi di ordinamento supportati dall’API. */
  readonly sortOptions = computed<SortOption[]>(() => {
    this.lang.current();
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: 'idDominio', label: t('Domini.Columns.IdDominio') },
      { id: 'ragioneSociale', label: t('Domini.Columns.RagioneSociale') },
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
        id: 'domini',
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
    this.displayConfigLoader.load('assets/config/domini-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'ragioneSociale', direction: 'asc' });
  readonly rows = signal<DominioSummary[]>([]);
  readonly hasMore = signal(false);
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchState = signal<SearchState>(initialSearchState([]));

  readonly hasActiveFilters = computed(() => {
    const f = this.searchState().filters;
    return !!(f[F.idDominio] || f[F.ragioneSociale] || (f[F.abilitato] && f[F.abilitato] !== ABIL.tutti));
  });

  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(() => !this.loading() && !this.hasError() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<DominioSummary>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<DominioSummary>(tableCfg.columns);
    return [
      { key: 'idDominio', header: 'Domini.Columns.IdDominio', cellClass: 'font-mono text-xs', width: '12rem' },
      { key: 'ragioneSociale', header: 'Domini.Columns.RagioneSociale', format: (d) => truncate(d.ragioneSociale) },
      {
        key: 'abilitato',
        header: 'Domini.Columns.Abilitato',
        cellType: 'badge',
        cellTone: (d) => (d.abilitato ? 'success' : 'muted'),
        format: (d) => this.translate.instant(d.abilitato ? 'Common.Yes' : 'Common.No'),
        width: '8rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Domini' }]);
    const saved = this.listState.get<{ search: SearchState; sort: SortEvent | null }>(DominiListComponent.STATE_KEY);
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

  onRowClick(d: DominioSummary): void {
    if (d.idDominio) this.router.navigate(['/domini', d.idDominio]);
  }

  private reset(): void {
    this.listState.set(DominiListComponent.STATE_KEY, { search: this.searchState(), sort: this.sort() }, this.rowConfig()?.persistState ?? false);
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.searchState().filters;
    const abil = f[F.abilitato];
    const filters: DominiListFilters = {
      page: this.page(),
      limit: PAGE_SIZE,
      sort: formatOrdinamento(this.sort()),
      total: append ? undefined : true,
      idDominio: f[F.idDominio] || undefined,
      ragioneSociale: f[F.ragioneSociale] || undefined,
      abilitato: abil === ABIL.si ? true : abil === ABIL.no ? false : undefined,
    };

    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Slice<DominioSummary>>({ results: [] });
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
