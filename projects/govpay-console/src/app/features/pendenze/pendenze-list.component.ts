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
import { ConfigService } from '@core/config';
import { ListStateService, SystemFacade } from '@core/system';
import { SnackbarService } from '@core/ui';
import {
  DataTableComponent,
  DateInputComponent,
  DisplayConfigLoader,
  EmptyStateComponent,
  LoadingComponent,
  InfiniteScrollDirective,
  ListStickyToolbarDirective,
  ItemListComponent,
  PageHeaderComponent,
  SearchInputComponent,
  SelectInputComponent,
  DATE_RANGE_OPTIONS,
  VIEW_OPTIONS,
  columnsFromConfig,
  daysAgoIso,
  formatDate,
  formatEuro,
  formatOrdinamento,
  matchDateRangePreset,
  truncate,
  type ColumnDef,
  type SelectOption,
  type SortEvent,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { PendenzeApi } from './pendenze.api';
import {
  STATO_PENDENZA_COLOR,
  STATO_PENDENZA_LABEL,
  type Pendenza,
  type PendenzeListFilters,
  type StatoPendenza,
} from './pendenza.model';

const PAGE_SIZE = 25;

interface ListFilters {
  search: string;
  stato: StatoPendenza | '';
  dataDa: string;
  dataA: string;
}

/**
 * Filtri di default applicati al primo caricamento e dopo "Azzera filtri":
 * `dataDa` impostata a 7 giorni fa (ultima settimana). Funzione (non costante)
 * per ricalcolare la data ad ogni invocazione.
 */
const defaultFilters = (): ListFilters => ({
  search: '',
  stato: '',
  dataDa: daysAgoIso(7),
  dataA: '',
});

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
    SearchInputComponent,
    SelectInputComponent,
    DateInputComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pendenze-list.component.html',
})
export class PendenzeListComponent implements OnInit {
  private readonly api = inject(PendenzeApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'pendenze';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  /** Default modalità lista da config: globale (`Layout.listView`) con
   *  override per feature (`Layout.listViewByFeature.pendenze`). Default `'table'`. */
  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['pendenze'] ?? layout?.listView ?? 'table';
  });
  /** Override locale del view mode (impostato dal pannello Tweaks). */
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  /** View mode effettivo: override locale prevale sul default da config. */
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  /**
   * Sezione del pannello tweaks globale registrata in costruttore via
   * `TweaksRegistry`. La cleanup è bound al `DestroyRef` del component:
   * navigando via, le righe spariscono dal pannello automaticamente.
   */
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
            labelKey: 'Tweaks.Range',
            hintKey: 'Tweaks.RangeHint',
            options: DATE_RANGE_OPTIONS,
            value: computed(() => matchDateRangePreset(this.filters().dataDa)),
            onChange: (v) => this.onDateRangeChange(v),
          },
        ],
        onReset: () => this.viewModeOverride.set(null),
      })
    );
  }

  /**
   * Display config caricato da `assets/config/pendenze-config.json` via HTTP.
   * Fino al fetch completato il signal vale `null` e il template mostra il
   * data-table (fallback).
   */
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
  readonly sort = signal<SortEvent | null>({ key: 'dataCaricamento', direction: 'desc' });
  readonly rows = signal<Pendenza[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(defaultFilters());
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    const d = defaultFilters();
    return f.search !== d.search || f.stato !== d.stato || f.dataDa !== d.dataDa || f.dataA !== d.dataA;
  });

  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(
    () => !this.loading() && !this.hasError() && !this.hasRows()
  );
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly statoOptions: SelectOption[] = (
    Object.keys(STATO_PENDENZA_LABEL) as StatoPendenza[]
  ).map((s) => ({ value: s, labelKey: STATO_PENDENZA_LABEL[s] }));

  readonly columns = computed<ColumnDef<Pendenza>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Pendenza>(tableCfg.columns);
    return [
      {
        key: 'numeroAvviso',
        header: 'Pendenze.Columns.Numero',
        format: (r) => r.numeroAvviso || r.iuv || '—',
        cellClass: 'font-mono text-xs',
        width: '12rem',
      },
      {
        key: 'tipoPendenza',
        header: 'Pendenze.Columns.Tipo',
        format: (r) => r.tipoPendenza?.descrizione ?? '',
      },
      {
        key: 'soggettoPagatore',
        header: 'Pendenze.Columns.Pagatore',
        format: (r) => truncate(r.soggettoPagatore?.anagrafica),
      },
      {
        key: 'causale',
        header: 'Pendenze.Columns.Causale',
        format: (r) => truncate(r.causale, 80),
      },
      {
        key: 'dataCaricamento',
        header: 'Pendenze.Columns.DataCaricamento',
        format: (r) => formatDate(r.dataCaricamento),
        sortable: true,
        width: '8rem',
      },
      {
        key: 'importo',
        header: 'Pendenze.Columns.Importo',
        format: (r) => formatEuro(r.importo),
        align: 'right',
        cellClass: 'font-mono',
        sortable: true,
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
    // Ripristina filtri e ordinamento dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters; sort: SortEvent | null }>(PendenzeListComponent.STATE_KEY);
    if (saved) {
      this.filters.set(saved.filters);
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

  onSearchChange(value: string): void {
    this.filters.update((f) => ({ ...f, search: value }));
    this.reset();
  }

  onStatoChange(value: string): void {
    this.filters.update((f) => ({ ...f, stato: value as StatoPendenza | '' }));
    this.reset();
  }

  onDataDaChange(value: string): void {
    this.filters.update((f) => ({ ...f, dataDa: value }));
    this.reset();
  }

  onDataAChange(value: string): void {
    this.filters.update((f) => ({ ...f, dataA: value }));
    this.reset();
  }

  resetFilters(): void {
    this.filters.set(defaultFilters());
    this.reset();
  }

  // ---- Tweaks panel handlers -----------------------------------------
  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  onDateRangeChange(value: string): void {
    const days = Number(value);
    if (!Number.isFinite(days) || days <= 0) return;
    this.filters.update((f) => ({ ...f, dataDa: daysAgoIso(days), dataA: '' }));
    this.reset();
  }


  onRowClick(p: Pendenza): void {
    if (!p.idA2A || !p.idPendenza) return;
    this.router.navigate(['/pendenze', p.idA2A, p.idPendenza]);
  }

  private reset(): void {
    // Persisti filtri/ordinamento per il ripristino al return dal detail.
    this.listState.set(PendenzeListComponent.STATE_KEY, {
      filters: this.filters(),
      sort: this.sort(),
    });
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.filters();
    const filters: PendenzeListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
      // ordinamento: formatOrdinamento(this.sort()),
      stato: f.stato || undefined,
      // Il backend GovPay riceve `iuv` o `numeroAvviso` per ricerca puntuale; qui
      // mappiamo la search generica su entrambi (preferendo numeroAvviso). Una
      // ricerca full-text richiederebbe un endpoint dedicato.
      numeroAvviso: f.search || undefined,
      dataDa: f.dataDa ? `${f.dataDa}T00:00` : undefined,
      dataA: f.dataA ? `${f.dataA}T23:59` : undefined,
    };

    this.api
      .list(filters)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of({ risultati: [], numRisultati: 0, numPagine: 1, pagina: 1, risPerPagina: PAGE_SIZE });
        })
      )
      .subscribe((page) => {
        const results = page.risultati ?? [];
        if (append) {
          this.rows.update((prev) => [...prev, ...results]);
        } else {
          this.rows.set(results);
        }
        this.total.set(page.numRisultati ?? 0);
        this.loading.set(false);
      });
  }

}
