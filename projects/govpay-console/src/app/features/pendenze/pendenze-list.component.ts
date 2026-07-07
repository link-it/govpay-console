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
  formatDate,
  formatEuro,
  formatOrdinamento,
  initialSearchState,
  truncate,
  type ColumnDef,
  type SearchField,
  type SearchPillLabels,
  type SearchState,
  type SortEvent,
} from '@linkit/shared-ui';
import { problemDetail, sliceHasMore, type Slice } from '@core/models';
import { AuthService } from '@core/auth/services/auth.service';
import { PendenzeConsoleApi } from './pendenze.console-api';
import {
  STATO_PENDENZA_COLOR,
  STATO_PENDENZA_LABEL,
  type PendenzaSummary,
  type PendenzeListFilters,
} from './pendenza.model';

const PAGE_SIZE = 25;

/** Chiavi filtro (= id dei `SearchField` della pill) allineate ai 4 filtri V2. */
const F = {
  idPendenza: 'idPendenza',
  numeroAvviso: 'numeroAvviso',
  idDominio: 'idDominio',
  identificativoDebitore: 'identificativoDebitore',
  // Range date: mostrati in anteprima, NON ancora inviati all'API V2.
  dataInizio: 'dataInizio',
  dataFine: 'dataFine',
} as const;

@Component({
  selector: 'lnk-pendenze-list',
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
  templateUrl: './pendenze-list.component.html',
})
export class PendenzeListComponent implements OnInit {
  private readonly api = inject(PendenzeConsoleApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'pendenze';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  /** Default modalità lista da config: globale con override per feature. */
  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['pendenze'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  /** Override di sessione (tweaks) della variante search-pill. */
  private readonly searchPillVariantOverride = signal<'pill' | 'square' | null>(null);
  /** Variante grafica della search-pill: override tweaks → app-config → `pill`. */
  readonly searchPillVariant = computed<'pill' | 'square'>(
    () => this.searchPillVariantOverride() ?? this.config.appConfig()?.Layout.searchPillVariant ?? 'pill'
  );

  private readonly searchPillDensityOverride = signal<'compact' | 'regular' | 'comfortable' | null>(null);
  readonly searchPillDensity = computed<'compact' | 'regular' | 'comfortable'>(
    () => this.searchPillDensityOverride() ?? this.config.appConfig()?.Layout.searchPillDensity ?? 'compact'
  );

  /** Domini in scope dell'utente (escluso il placeholder `*`). */
  private readonly domini = computed(() =>
    (this.auth.user()?.domini ?? []).filter((d) => d.idDominio && d.idDominio !== '*')
  );
  /** Etichette dominio (ragioneSociale) usate come opzioni del select `idDominio`. */
  private readonly dominiLabels = computed(() =>
    this.domini().map((d) => d.ragioneSociale || d.idDominio)
  );
  /** Mappa ragioneSociale → idDominio per risolvere il valore del select verso l'API. */
  private readonly dominioIdByLabel = computed(() => {
    const map = new Map<string, string>();
    for (const d of this.domini()) map.set(d.ragioneSociale || d.idDominio, d.idDominio);
    return map;
  });

  /**
   * Config dei filtri della search-pill: i 4 filtri supportati dalla API V2.
   * `idDominio` è un select popolato dai domini del profilo (label = ragioneSociale).
   * La ricerca libera della pill (query) è decorativa e non inviata all'API.
   */
  readonly searchFields = computed<SearchField[]>(() => {
    this.lang.current(); // dipendenza: ritraduce al cambio lingua
    const f = this.searchState().filters;
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: F.idPendenza, label: t('Pendenze.Filters.IdPendenza'), kind: 'text', placeholder: t('Pendenze.Filters.IdPendenzaPlaceholder'), span: 2 },
      { id: F.numeroAvviso, label: t('Pendenze.Filters.NumeroAvviso'), kind: 'text', placeholder: t('Pendenze.Filters.NumeroAvvisoPlaceholder') },
      {
        id: F.idDominio,
        label: t('Pendenze.Filters.Dominio'),
        kind: 'select',
        icon: 'bootstrapBuilding',
        options: ['', ...this.dominiLabels()],
        placeholder: t('Pendenze.Filters.DominioPlaceholder'),
        // Sempre dropdown (mai segmented) e ricercabile appena c'è almeno un ente.
        segmentedMax: 0,
        searchableFrom: 1,
      },
      { id: F.identificativoDebitore, label: t('Pendenze.Filters.IdentificativoDebitore'), kind: 'text', icon: 'bootstrapPerson', placeholder: t('Pendenze.Filters.IdentificativoDebitorePlaceholder'), span: 2 },
      // Range date (anteprima): il "fino a" non può precedere il "da" e viceversa.
      { id: F.dataInizio, label: t('Pendenze.Filters.DataInizio'), kind: 'date', icon: 'bootstrapCalendarEvent', max: f[F.dataFine] || undefined },
      { id: F.dataFine, label: t('Pendenze.Filters.DataFine'), kind: 'date', icon: 'bootstrapCalendarEvent', min: f[F.dataInizio] || undefined },
    ];
  });

  /** Placeholder della barra e label generiche della search-pill, tradotti. */
  readonly searchPlaceholder = computed(() => {
    this.lang.current();
    return this.translate.instant('Pendenze.Filters.Placeholder');
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
    };
  });

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'pendenze',
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

  /** Display config da `assets/config/pendenze-config.json` (null fino al fetch). */
  readonly rowConfig = toSignal(
    this.displayConfigLoader.load('assets/config/pendenze-config.json').pipe(
      catchError(() => {
        this.snackbar.error(this.translate.instant('Common.LoadError'));
        return of(null);
      }),
    ),
    { initialValue: null },
  );

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'dataUltimoAggiornamento', direction: 'desc' });
  readonly rows = signal<PendenzaSummary[]>([]);
  /** `hasNextPage` dello slice: pilota l'infinite scroll. */
  readonly hasMore = signal(false);
  /** Totale risultati (`total=true` sulla prima pagina). `null` se non disponibile. */
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Stato della search-pill (query + filters + sort/dir). Sort/dir non usati (sort da tabella). */
  readonly searchState = signal<SearchState>(initialSearchState([]));

  readonly hasActiveFilters = computed(() => {
    const f = this.searchState().filters;
    return !!(f[F.idPendenza] || f[F.numeroAvviso] || f[F.idDominio] || f[F.identificativoDebitore]);
  });

  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(
    () => !this.loading() && !this.hasError() && !this.hasRows()
  );
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<PendenzaSummary>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<PendenzaSummary>(tableCfg.columns);
    return [
      {
        key: 'numeroAvviso',
        header: 'Pendenze.Columns.Numero',
        format: (r) => r.numeroAvviso || r.iuvAvviso || '—',
        cellClass: 'font-mono text-xs',
        width: '12rem',
      },
      {
        key: 'tipoPendenza',
        header: 'Pendenze.Columns.Tipo',
        format: (r) => r.tipoPendenza?.descrizione ?? '',
      },
      {
        key: 'causale',
        header: 'Pendenze.Columns.Causale',
        format: (r) => truncate(r.causale, 80),
      },
      {
        key: 'dataUltimoAggiornamento',
        header: 'Pendenze.Columns.DataAggiornamento',
        format: (r) => formatDate(r.dataUltimoAggiornamento),
        sortable: true,
        width: '8rem',
      },
      {
        key: 'importo',
        header: 'Pendenze.Columns.Importo',
        format: (r) => formatEuro(r.importo),
        align: 'right',
        cellClass: 'font-mono',
        width: '8rem',
      },
      {
        key: 'stato',
        header: 'Pendenze.Columns.Stato',
        cellType: 'badge',
        cellTone: (r) => STATO_PENDENZA_COLOR[r.stato] ?? 'muted',
        format: (r) => STATO_PENDENZA_LABEL[r.stato] ?? r.stato,
        width: '10rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Pendenze' }]);
    // Ripristina stato ricerca e ordinamento dopo back da dettaglio.
    const saved = this.listState.get<{ search: SearchState; sort: SortEvent | null }>(PendenzeListComponent.STATE_KEY);
    if (saved) {
      if (saved.search) this.searchState.set(saved.search);
      if (saved.sort) this.sort.set(saved.sort);
    }
    this.reset();
  }

  onSortChange(s: SortEvent): void {
    this.sort.set(s);
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

  /** Emesso dalla search-pill (Invio o "Cerca"): riparte dalla pagina 1. */
  onSearch(state: SearchState): void {
    this.searchState.set(state);
    this.reset();
  }

  resetFilters(): void {
    this.searchState.set(initialSearchState(this.searchFields()));
    this.reset();
  }

  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  onRowClick(p: PendenzaSummary): void {
    if (!p.idA2A || !p.idPendenza) return;
    this.router.navigate(['/pendenze', p.idA2A, p.idPendenza]);
  }

  private reset(): void {
    // Persisti stato ricerca/ordinamento per il ripristino al return dal detail.
    this.listState.set(PendenzeListComponent.STATE_KEY, {
      search: this.searchState(),
      sort: this.sort(),
    });
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.searchState().filters;
    // Il select dominio porta la ragioneSociale: risolvi verso l'idDominio API.
    const idDominio = f[F.idDominio] ? this.dominioIdByLabel().get(f[F.idDominio]) : undefined;
    const filters: PendenzeListFilters = {
      page: this.page(),
      limit: PAGE_SIZE,
      sort: formatOrdinamento(this.sort()),
      // Conteggio totale solo sulla prima pagina (evita COUNT extra per pagina).
      total: append ? undefined : true,
      idPendenza: f[F.idPendenza] || undefined,
      numeroAvviso: f[F.numeroAvviso] || undefined,
      idDominio: idDominio || undefined,
      identificativoDebitore: f[F.identificativoDebitore] || undefined,
      // NB: F.dataInizio / F.dataFine sono in anteprima nella UI ma non ancora
      // inviati: la API V2 non supporta (per ora) il filtro per range di date.
    };

    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Slice<PendenzaSummary>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const results = slice.results ?? [];
        if (append) {
          this.rows.update((prev) => [...prev, ...results]);
        } else {
          this.rows.set(results);
        }
        const totalResults = slice.pagination?.totalResults;
        if (totalResults != null) this.total.set(totalResults);
        this.hasMore.set(sliceHasMore(slice));
        this.loading.set(false);
      });
  }
}
