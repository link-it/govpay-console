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
  columnsFromConfig,
  daysAgoIso,
  formatDateTime,
  initialSearchState,
  truncate,
  type ColumnDef,
  type SearchField,
  type SearchPillLabels,
  type SearchState,
} from '@linkit/shared-ui';
import { problemDetail, sliceHasMore, type Slice } from '@core/models';
import { dayToIso } from '@core/utils/date';
import { GiornaleEventiConsoleApi } from './giornale-eventi.console-api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  type CategoriaEvento,
  type EsitoEvento,
  type EventoListFilters,
  type EventoSummary,
} from './evento.model';
import { PreferencesService } from '@core/preferences';

const PAGE_SIZE = 25;

/** Ampiezza massima della finestra per cui il BE ammette `total=true` (24h). */
const COUNT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Chiavi filtro (= id dei `SearchField` della search-pill). */
const F = {
  iuv: 'iuv',
  idDominio: 'idDominio',
  esito: 'esito',
  categoria: 'categoria',
  dataDa: 'dataDa',
  dataA: 'dataA',
} as const;

/**
 * Stato di ricerca di default: `dataDa` a 1 giorno fa (ultime 24 ore con
 * granularità giornaliera del filtro date della pill).
 */
function defaultSearchState(): SearchState {
  const s = initialSearchState([]);
  return { ...s, filters: { ...s.filters, [F.dataDa]: daysAgoIso(1) } };
}

@Component({
  selector: 'lnk-giornale-eventi-list',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './giornale-eventi-list.component.html',
})
export class GiornaleEventiListComponent implements OnInit {
  private readonly api = inject(GiornaleEventiConsoleApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly lang = inject(LanguageService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['giornale-eventi'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  private readonly prefView = inject(PreferencesService);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.prefView.featureView('giornale-eventi') ?? this.viewModeDefault()
  );

  /** Variante grafica della search-pill: override tweaks → app-config → `pill`. */
  private readonly searchPillVariantOverride = signal<'pill' | 'square' | null>(null);
  readonly searchPillVariant = computed<'pill' | 'square'>(
    () => this.searchPillVariantOverride() ?? this.cfgSvc.appConfig()?.Layout.searchPillVariant ?? 'pill'
  );
  private readonly searchPillDensityOverride = signal<'compact' | 'regular' | 'comfortable' | null>(null);
  readonly searchPillDensity = computed<'compact' | 'regular' | 'comfortable'>(
    () => this.searchPillDensityOverride() ?? this.cfgSvc.appConfig()?.Layout.searchPillDensity ?? 'compact'
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'giornale-eventi',
        titleKey: 'Tweaks.Layout',
        rows: [
          { type: 'segmented', labelKey: 'Tweaks.SearchPill', hintKey: 'Tweaks.SearchPillHint',
            options: SEARCH_PILL_VARIANT_OPTIONS, value: this.searchPillVariant,
            onChange: (v) => this.searchPillVariantOverride.set(v === 'square' ? 'square' : 'pill') },
          { type: 'segmented', labelKey: 'Tweaks.Density', hintKey: 'Tweaks.DensityHint',
            options: SEARCH_PILL_DENSITY_OPTIONS, value: this.searchPillDensity,
            onChange: (v) => this.searchPillDensityOverride.set(v as 'compact' | 'regular' | 'comfortable') },
        ],
        onReset: () => {
          (this.prefView.setFeatureView('giornale-eventi', null), this.viewModeOverride.set(null));
          this.searchPillVariantOverride.set(null);
          this.searchPillDensityOverride.set(null);
        },
      })
    );
  }

  readonly rowConfig = toSignal(
    this.displayConfigLoader.load('assets/config/giornale-eventi-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'giornale-eventi';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  /** Pagina corrente (paginazione offset `/eventi`, 1-based). */
  private readonly page = signal(1);
  readonly rows = signal<EventoSummary[]>([]);
  readonly hasMore = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Totale (conteggio on-demand); `null` finché non richiesto. */
  readonly total = signal<number | null>(null);
  /** Conteggio totale on-demand in corso. */
  readonly countLoading = signal(false);

  /** Stato della search-pill (query + filters). Sort non usato: ordine fisso lato BE. */
  readonly searchState = signal<SearchState>(defaultSearchState());

  /** Label → enum per i select localizzati (la pill memorizza la label). */
  private readonly esitoByLabel = computed(() => {
    this.lang.current();
    const map = new Map<string, EsitoEvento>();
    (Object.keys(ESITO_EVENTO_LABEL) as EsitoEvento[]).forEach((e) =>
      map.set(this.translate.instant(ESITO_EVENTO_LABEL[e]), e)
    );
    return map;
  });
  private readonly categoriaByLabel = computed(() => {
    this.lang.current();
    const map = new Map<string, CategoriaEvento>();
    (Object.keys(CATEGORIA_EVENTO_LABEL) as CategoriaEvento[]).forEach((c) =>
      map.set(this.translate.instant(CATEGORIA_EVENTO_LABEL[c]), c)
    );
    return map;
  });

  readonly searchFields = computed<SearchField[]>(() => {
    this.lang.current(); // dipendenza: ritraduce al cambio lingua
    const f = this.searchState().filters;
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: F.iuv, label: t('GiornaleEventi.Filters.Iuv'), kind: 'text', placeholder: t('GiornaleEventi.Filters.IuvPlaceholder') },
      { id: F.idDominio, label: t('GiornaleEventi.Filters.IdDominio'), kind: 'text', icon: 'bootstrapBuilding', placeholder: t('GiornaleEventi.Filters.IdDominioPlaceholder') },
      { id: F.esito, label: t('GiornaleEventi.Filters.Esito'), kind: 'select', options: ['', ...this.esitoByLabel().keys()], placeholder: t('Common.All') },
      { id: F.categoria, label: t('GiornaleEventi.Filters.Categoria'), kind: 'select', options: ['', ...this.categoriaByLabel().keys()], placeholder: t('Common.All') },
      { id: F.dataDa, label: t('Common.DateFrom'), kind: 'date', icon: 'bootstrapCalendarEvent', max: f[F.dataA] || undefined },
      { id: F.dataA, label: t('Common.DateTo'), kind: 'date', icon: 'bootstrapCalendarEvent', min: f[F.dataDa] || undefined },
    ];
  });

  readonly searchPlaceholder = computed(() => {
    this.lang.current();
    return this.translate.instant('GiornaleEventi.Filters.Placeholder');
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

  readonly hasActiveFilters = computed(() => {
    const f = this.searchState().filters;
    return !!(f[F.iuv] || f[F.idDominio] || f[F.esito] || f[F.categoria] || f[F.dataA]) || f[F.dataDa] !== daysAgoIso(1);
  });
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  /**
   * Il conteggio (`total=true`) è l'operazione più costosa sulla tabella eventi:
   * il BE lo ammette solo con una finestra temporale ≤ 24h (altrimenti 400).
   * Calcoliamo la finestra effettiva `[dataDa 00:00, dataA 23:59 | ora]` con la
   * stessa conversione della query e mostriamo il link "mostra totale" solo se
   * rientra nel limite; fuori dal limite il link resta nascosto.
   */
  readonly canShowCount = computed(() => {
    const f = this.searchState().filters;
    const startIso = dayToIso(f[F.dataDa], false);
    const endIso = dayToIso(f[F.dataA], true);
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    // dataDa assente: il BE assume le ultime 24h → finestra al limite, ammessa.
    const start = startIso ? new Date(startIso).getTime() : end - COUNT_WINDOW_MS;
    return end - start <= COUNT_WINDOW_MS;
  });

  readonly columns = computed<ColumnDef<EventoSummary>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<EventoSummary>(tableCfg.columns);
    return [
    {
      key: 'dataEvento',
      header: 'GiornaleEventi.Columns.Data',
      format: (r) => formatDateTime(r.dataEvento),
      cellClass: 'font-mono text-xs',
      width: '12rem',
    },
    {
      key: 'categoriaEvento',
      header: 'GiornaleEventi.Columns.Categoria',
      format: (r) => (r.categoriaEvento ? CATEGORIA_EVENTO_LABEL[r.categoriaEvento] : '—'),
      width: '8rem',
    },
    {
      key: 'tipoEvento',
      header: 'GiornaleEventi.Columns.Tipo',
      format: (r) => truncate([r.tipoEvento, r.sottotipoEvento].filter(Boolean).join(' / ') || '—', 60),
    },
    {
      key: 'componente',
      header: 'GiornaleEventi.Columns.Componente',
      format: (r) => truncate(r.componente || '—'),
    },
    {
      key: 'iuv',
      header: 'GiornaleEventi.Columns.Iuv',
      cellClass: 'font-mono text-xs',
      format: (r) => r.iuv || '—',
      width: '11rem',
    },
    {
      key: 'durataEventoMs',
      header: 'GiornaleEventi.Columns.Durata',
      format: (r) => (r.durataEventoMs != null ? `${r.durataEventoMs} ms` : '—'),
      align: 'right',
      cellClass: 'font-mono text-xs',
      width: '6rem',
    },
    {
      key: 'esito',
      header: 'GiornaleEventi.Columns.Esito',
      cellType: 'badge',
      cellTone: (r) => ESITO_EVENTO_COLOR[r.esito] ?? 'muted',
      format: (r) => ESITO_EVENTO_LABEL[r.esito] ?? '—',
      width: '7rem',
    },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.GiornaleEventi' }]);
    // Ripristina stato ricerca dopo back da dettaglio.
    const saved = this.listState.get<{ search: SearchState }>(GiornaleEventiListComponent.STATE_KEY);
    if (saved?.search) this.searchState.set(saved.search);
    this.reset();
  }

  refresh(): void { this.reset(); }

  /**
   * Conteggio totale **su richiesta**: stessa query (filtri correnti) con
   * `page/limit=1` e `total=true`. Esposto solo quando {@link canShowCount} è
   * vero, quindi la finestra è già ≤ 24h (vincolo del BE).
   */
  requestCount(): void {
    if (this.countLoading()) return;
    this.countLoading.set(true);
    this.api
      .list({ ...this.baseFilters(), page: 1, limit: 1, total: true })
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of<Slice<EventoSummary>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const t = slice.pagination?.totalResults;
        if (t != null) this.total.set(t);
        this.countLoading.set(false);
      });
  }
  onRowClick(e: EventoSummary): void {
    if (e.id != null) this.router.navigate(['/giornale-eventi', e.id]);
  }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }

  /** Emesso dalla search-pill (Invio o "Cerca"): riparte dalla prima pagina. */
  onSearch(state: SearchState): void {
    this.searchState.set(state);
    this.reset();
  }
  resetFilters(): void {
    this.searchState.set(defaultSearchState());
    this.reset();
  }
  onViewModeChange(value: string): void {
    const v = value === 'rows' ? 'rows' : 'table';
    this.viewModeOverride.set(v);
    this.prefView.setFeatureView('giornale-eventi', v);
  }

  private reset(): void {
    // Persisti stato ricerca per il ripristino al return dal detail.
    this.listState.set(GiornaleEventiListComponent.STATE_KEY, {
      search: this.searchState(),
    }, this.rowConfig()?.persistState ?? false);
    this.page.set(1);
    this.rows.set([]);
    this.hasMore.set(false);
    // Il totale eventualmente mostrato non è più valido per i nuovi filtri.
    this.total.set(null);
    this.fetch(false);
  }

  /** Filtri di ricerca senza paginazione. */
  private baseFilters(): EventoListFilters {
    const f = this.searchState().filters;
    return {
      iuv: f[F.iuv] || undefined,
      idDominio: f[F.idDominio] || undefined,
      esito: f[F.esito] ? this.esitoByLabel().get(f[F.esito]) : undefined,
      categoriaEvento: f[F.categoria] ? this.categoriaByLabel().get(f[F.categoria]) : undefined,
      // `/eventi` richiede ISO 8601 date-time completo (RFC 3339), non il
      // troncato `YYYY-MM-DDTHH:MM` delle liste V1.
      dataDa: dayToIso(f[F.dataDa], false),
      dataA: dayToIso(f[F.dataA], true),
    };
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);
    // Paginazione **offset**: ogni pagina ripete i filtri (incluso il range
    // date, richiesto dal GDE) e avanza `page`. La modalità cursor non è
    // utilizzabile qui perché la prima pagina — senza `?cursor=` — risponde
    // sempre in offset (con `pagination`, senza `nextCursor`): affidarsi al
    // cursore degradava la pagina successiva a un `?limit=25` senza `dataDa`,
    // rifiutato dal GDE con 502.
    const filters: EventoListFilters = { ...this.baseFilters(), page: this.page(), limit: PAGE_SIZE };
    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Slice<EventoSummary>>({ results: [] });
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
}
