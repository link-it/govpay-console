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
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TweaksRegistry, ConfigService, ListStateService, SystemFacade, SnackbarService, LanguageService } from '@linkit/shared-ui';
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
  formatDateTime,
  formatEuro,
  formatOrdinamento,
  initialSearchState,
  type ColumnDef,
  type SearchField,
  type SearchPillLabels,
  type SearchState,
  type SortEvent,
  type SortOption,
} from '@linkit/shared-ui';
import { problemDetail, sliceHasMore, type Slice } from '@core/models';
import { RicevuteConsoleApi } from './ricevute.console-api';
import { statoRtColor, statoRtLabel, type RicevutaSummary, type RicevuteListFilters } from './ricevuta.model';

const PAGE_SIZE = 25;

/** Chiavi filtro (= id dei `SearchField` della pill) allineate ai filtri V2. */
const F = {
  iuv: 'iuv',
  idDominio: 'idDominio',
  idRicevuta: 'idRicevuta',
  dataDa: 'dataDa',
  dataA: 'dataA',
} as const;

@Component({
  selector: 'lnk-ricevute-list',
  standalone: true,
  imports: [
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
  templateUrl: './ricevute-list.component.html',
})
export class RicevuteListComponent implements OnInit {
  private readonly api = inject(RicevuteConsoleApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'ricevute';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  /** Default modalità lista da config: globale con override per feature. */
  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['ricevute'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(() => this.viewModeOverride() ?? this.viewModeDefault());

  /** Override di sessione (tweaks) della variante search-pill. */
  private readonly searchPillVariantOverride = signal<'pill' | 'square' | null>(null);
  readonly searchPillVariant = computed<'pill' | 'square'>(
    () => this.searchPillVariantOverride() ?? this.config.appConfig()?.Layout.searchPillVariant ?? 'pill'
  );

  private readonly searchPillDensityOverride = signal<'compact' | 'regular' | 'comfortable' | null>(null);
  readonly searchPillDensity = computed<'compact' | 'regular' | 'comfortable'>(
    () => this.searchPillDensityOverride() ?? this.config.appConfig()?.Layout.searchPillDensity ?? 'compact'
  );

  /**
   * Config dei filtri della search-pill: i filtri supportati dalla API V2.
   * `iuv`/`idRicevuta` match esatto, `idDominio` codice a 11 cifre, range di
   * date sulla data di pagamento (inclusivo).
   */
  readonly searchFields = computed<SearchField[]>(() => {
    this.lang.current();
    const f = this.searchState().filters;
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: F.iuv, label: t('Ricevute.Filters.Iuv'), kind: 'text', placeholder: t('Ricevute.Filters.IuvPlaceholder'), span: 2 },
      { id: F.idRicevuta, label: t('Ricevute.Filters.IdRicevuta'), kind: 'text', placeholder: t('Ricevute.Filters.IdRicevutaPlaceholder') },
      { id: F.idDominio, label: t('Ricevute.Filters.Dominio'), kind: 'text', icon: 'bootstrapBuilding', placeholder: t('Ricevute.Filters.DominioPlaceholder') },
      { id: F.dataDa, label: t('Ricevute.Filters.DataDa'), kind: 'date', icon: 'bootstrapCalendarEvent', max: f[F.dataA] || undefined },
      { id: F.dataA, label: t('Ricevute.Filters.DataA'), kind: 'date', icon: 'bootstrapCalendarEvent', min: f[F.dataDa] || undefined },
    ];
  });

  readonly searchPlaceholder = computed(() => {
    this.lang.current();
    return this.translate.instant('Ricevute.Filters.Placeholder');
  });

  /** Campi di ordinamento (offset). La modalità cursor userebbe l'ordine fisso. */
  readonly sortOptions = computed<SortOption[]>(() => {
    this.lang.current();
    const t = (k: string) => this.translate.instant(k);
    return [{ id: 'dataPagamento', label: t('Ricevute.Columns.DataPagamento') }];
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
        id: 'ricevute',
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

  /** Display config da `assets/config/ricevute-config.json` (null fino al fetch). */
  readonly rowConfig = toSignal(
    this.displayConfigLoader.load('assets/config/ricevute-config.json').pipe(
      catchError(() => {
        this.snackbar.error(this.translate.instant('Common.LoadError'));
        return of(null);
      }),
    ),
    { initialValue: null },
  );

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'dataPagamento', direction: 'desc' });
  readonly rows = signal<RicevutaSummary[]>([]);
  readonly hasMore = signal(false);
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchState = signal<SearchState>(initialSearchState([]));

  readonly hasActiveFilters = computed(() => {
    const f = this.searchState().filters;
    return !!(f[F.iuv] || f[F.idRicevuta] || f[F.idDominio] || f[F.dataDa] || f[F.dataA]);
  });

  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(() => !this.loading() && !this.hasError() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<RicevutaSummary>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<RicevutaSummary>(tableCfg.columns);
    return [
      { key: 'iuv', header: 'Ricevute.Columns.Iuv', format: (r) => r.iuv, cellClass: 'font-mono text-xs', width: '14rem' },
      { key: 'idRicevuta', header: 'Ricevute.Columns.IdRicevuta', format: (r) => r.idRicevuta, cellClass: 'font-mono text-xs' },
      { key: 'idDominio', header: 'Ricevute.Columns.Dominio', format: (r) => r.idDominio, cellClass: 'font-mono text-xs' },
      { key: 'dataPagamento', header: 'Ricevute.Columns.DataPagamento', format: (r) => formatDateTime(r.dataPagamento), width: '11rem' },
      { key: 'importo', header: 'Ricevute.Columns.Importo', format: (r) => formatEuro(r.importo), align: 'right', cellClass: 'font-mono', width: '8rem' },
      {
        key: 'stato',
        header: 'Ricevute.Columns.Stato',
        cellType: 'badge',
        cellTone: (r) => statoRtColor(r.stato),
        format: (r) => statoRtLabel(r.stato),
        width: '10rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Ricevute' }]);
    const saved = this.listState.get<{ search: SearchState; sort: SortEvent | null }>(RicevuteListComponent.STATE_KEY);
    if (saved?.search) this.searchState.set(saved.search);
    if (saved?.sort) this.sort.set(saved.sort);
    this.syncPillSort();
    this.reset();
  }

  /** Allinea sort/dir della search-pill al `sort` signal. */
  private syncPillSort(): void {
    const s = this.sort();
    this.searchState.update((v) => ({ ...v, sort: s?.key ?? '', dir: s?.direction ?? 'desc' }));
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

  onRowClick(r: RicevutaSummary): void {
    if (!r.idDominio || !r.iuv || !r.idRicevuta) return;
    this.router.navigate(['/ricevute', r.idDominio, r.iuv, r.idRicevuta]);
  }

  private reset(): void {
    this.listState.set(RicevuteListComponent.STATE_KEY, { search: this.searchState(), sort: this.sort() });
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.searchState().filters;
    const filters: RicevuteListFilters = {
      page: this.page(),
      limit: PAGE_SIZE,
      sort: formatOrdinamento(this.sort()),
      total: append ? undefined : true,
      iuv: f[F.iuv] || undefined,
      idRicevuta: f[F.idRicevuta] || undefined,
      idDominio: f[F.idDominio] || undefined,
      // Formato data richiesto dal backend: YYYY-MM-DDTHH:MM.
      dataDa: f[F.dataDa] ? `${f[F.dataDa]}T00:00` : undefined,
      dataA: f[F.dataA] ? `${f[F.dataA]}T23:59` : undefined,
    };

    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Slice<RicevutaSummary>>({ results: [] });
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
