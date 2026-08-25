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
  ViewToggleComponent,
  SEARCH_PILL_DENSITY_OPTIONS,
  SEARCH_PILL_VARIANT_OPTIONS,
  VIEW_OPTIONS,
  columnsFromConfig,
  formatDateTime,
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
import { dayToIso } from '@core/utils/date';
import { TracciatiConsoleApi } from './tracciati.console-api';
import { TracciatoUploadComponent } from './tracciato-upload.component';
import {
  STATO_TRACCIATO_COLOR,
  STATO_TRACCIATO_LABEL,
  type FormatoTracciato,
  type StatoTracciato,
  type Tracciato,
  type TracciatiListFilters,
} from './tracciato.model';

const PAGE_SIZE = 25;
const FORMATI: FormatoTracciato[] = ['JSON', 'CSV'];

/** Chiavi filtro (= id dei `SearchField` della search-pill). */
const F = {
  idDominio: 'idDominio',
  stato: 'stato',
  formato: 'formato',
  operatore: 'operatore',
  dataDa: 'dataDa',
  dataA: 'dataA',
} as const;

@Component({
  selector: 'lnk-tracciati-list',
  standalone: true,
  imports: [
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
    TracciatoUploadComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracciati-list.component.html',
})
export class TracciatiListComponent implements OnInit {
  private readonly api = inject(TracciatiConsoleApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'tracciati';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['tracciati'] ?? layout?.listView ?? 'table';
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

  /** Card di upload aperta/chiusa. */
  readonly showUpload = signal(false);

  private readonly statoByLabel = computed(() => {
    this.lang.current();
    const map = new Map<string, StatoTracciato>();
    (Object.keys(STATO_TRACCIATO_LABEL) as StatoTracciato[]).forEach((s) =>
      map.set(this.translate.instant(STATO_TRACCIATO_LABEL[s]), s)
    );
    return map;
  });

  readonly searchFields = computed<SearchField[]>(() => {
    this.lang.current();
    const f = this.searchState().filters;
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: F.idDominio, label: t('Tracciati.Filters.Dominio'), kind: 'text', icon: 'bootstrapBuilding', placeholder: t('Tracciati.Filters.DominioPlaceholder'), span: 2 },
      { id: F.stato, label: t('Tracciati.Filters.Stato'), kind: 'select', options: ['', ...this.statoByLabel().keys()], placeholder: t('Common.All') },
      { id: F.formato, label: t('Tracciati.Filters.Formato'), kind: 'select', options: ['', ...FORMATI], placeholder: t('Common.All') },
      { id: F.operatore, label: t('Tracciati.Filters.Operatore'), kind: 'text', icon: 'bootstrapPerson', placeholder: t('Tracciati.Filters.OperatorePlaceholder') },
      { id: F.dataDa, label: t('Tracciati.Filters.DataDa'), kind: 'date', icon: 'bootstrapCalendarEvent', max: f[F.dataA] || undefined },
      { id: F.dataA, label: t('Tracciati.Filters.DataA'), kind: 'date', icon: 'bootstrapCalendarEvent', min: f[F.dataDa] || undefined },
    ];
  });

  readonly searchPlaceholder = computed(() => {
    this.lang.current();
    return this.translate.instant('Tracciati.Filters.Placeholder');
  });

  readonly sortOptions = computed<SortOption[]>(() => {
    this.lang.current();
    return [{ id: 'dataOraCaricamento', label: this.translate.instant('Tracciati.Columns.DataCaricamento') }];
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
        id: 'tracciati',
        titleKey: 'Tweaks.Layout',
        rows: [
          { type: 'segmented', labelKey: 'Tweaks.View', hintKey: 'Tweaks.ViewHint',
            options: VIEW_OPTIONS, value: this.viewMode, onChange: (v) => this.onViewModeChange(v) },
          { type: 'segmented', labelKey: 'Tweaks.SearchPill', hintKey: 'Tweaks.SearchPillHint',
            options: SEARCH_PILL_VARIANT_OPTIONS, value: this.searchPillVariant,
            onChange: (v) => this.searchPillVariantOverride.set(v === 'square' ? 'square' : 'pill') },
          { type: 'segmented', labelKey: 'Tweaks.Density', hintKey: 'Tweaks.DensityHint',
            options: SEARCH_PILL_DENSITY_OPTIONS, value: this.searchPillDensity,
            onChange: (v) => this.searchPillDensityOverride.set(v as 'compact' | 'regular' | 'comfortable') },
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
    this.displayConfigLoader.load('assets/config/tracciati-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'dataOraCaricamento', direction: 'desc' });
  readonly rows = signal<Tracciato[]>([]);
  readonly hasMore = signal(false);
  readonly total = signal<number | null>(null);
  readonly countLoading = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchState = signal<SearchState>(initialSearchState([]));

  readonly hasActiveFilters = computed(() => {
    const f = this.searchState().filters;
    return !!(f[F.idDominio] || f[F.stato] || f[F.formato] || f[F.operatore] || f[F.dataDa] || f[F.dataA]);
  });
  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(() => !this.loading() && !this.hasError() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<Tracciato>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Tracciato>(tableCfg.columns);
    return [
      { key: 'nomeFile', header: 'Tracciati.Columns.NomeFile', format: (r) => r.nomeFile, cellClass: 'font-mono text-xs' },
      { key: 'dominio', header: 'Tracciati.Columns.Dominio', format: (r) => truncate(r.dominio?.ragioneSociale || r.dominio?.idDominio || '—') },
      { key: 'formatoRichiesta', header: 'Tracciati.Columns.Formato', format: (r) => r.formatoRichiesta, width: '6rem' },
      { key: 'dataOraCaricamento', header: 'Tracciati.Columns.DataCaricamento', format: (r) => formatDateTime(r.dataOraCaricamento), sortable: true, width: '11rem' },
      { key: 'operatoreMittente', header: 'Tracciati.Columns.Operatore', format: (r) => truncate(r.operatoreMittente || '—') },
      {
        key: 'stato',
        header: 'Tracciati.Columns.Stato',
        cellType: 'badge',
        cellTone: (r) => STATO_TRACCIATO_COLOR[r.stato] ?? 'muted',
        format: (r) => STATO_TRACCIATO_LABEL[r.stato] ?? r.stato,
        width: '12rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Tracciati' }]);
    const saved = this.listState.get<{ search: SearchState; sort: SortEvent | null }>(TracciatiListComponent.STATE_KEY);
    if (saved?.search) this.searchState.set(saved.search);
    if (saved?.sort) this.sort.set(saved.sort);
    this.syncPillSort();
    this.reset();
  }

  private syncPillSort(): void {
    const s = this.sort();
    this.searchState.update((v) => ({ ...v, sort: s?.key ?? '', dir: s?.direction ?? 'desc' }));
  }

  onSortChange(s: SortEvent): void {
    this.sort.set(s);
    this.syncPillSort();
    this.reset();
  }

  refresh(): void { this.reset(); }

  toggleUpload(): void { this.showUpload.update((v) => !v); }
  onUploaded(id: number): void {
    this.showUpload.set(false);
    this.router.navigate(['/tracciati', id]);
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

  onRowClick(r: Tracciato): void {
    if (r.id == null) return;
    this.router.navigate(['/tracciati', r.id]);
  }

  private reset(): void {
    this.listState.set(TracciatiListComponent.STATE_KEY, {
      search: this.searchState(),
      sort: this.sort(),
    }, this.rowConfig()?.persistState ?? false);
    this.page.set(1);
    this.rows.set([]);
    this.total.set(null);
    this.fetch(false);
  }

  private baseFilters(): TracciatiListFilters {
    const f = this.searchState().filters;
    return {
      idDominio: f[F.idDominio] || undefined,
      stato: f[F.stato] ? this.statoByLabel().get(f[F.stato]) : undefined,
      formatoRichiesta: (f[F.formato] as FormatoTracciato) || undefined,
      operatoreMittente: f[F.operatore] || undefined,
      dataDa: dayToIso(f[F.dataDa], false),
      dataA: dayToIso(f[F.dataA], true),
    };
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);
    const filters: TracciatiListFilters = {
      ...this.baseFilters(),
      page: this.page(),
      limit: PAGE_SIZE,
      sort: formatOrdinamento(this.sort()),
    };
    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Slice<Tracciato>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const results = slice.results ?? [];
        if (append) this.rows.update((prev) => [...prev, ...results]);
        else this.rows.set(results);
        this.hasMore.set(sliceHasMore(slice));
        this.loading.set(false);
      });
  }

  requestCount(): void {
    if (this.countLoading()) return;
    this.countLoading.set(true);
    this.api
      .list({ ...this.baseFilters(), page: 1, limit: 1, total: true })
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of<Slice<Tracciato>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const t = slice.pagination?.totalResults;
        if (t != null) this.total.set(t);
        this.countLoading.set(false);
      });
  }
}
