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
import { RiscossioniApi } from './riscossioni.api';
import {
  STATO_RISCOSSIONE_COLOR,
  STATO_RISCOSSIONE_LABEL,
  type Riscossione,
  type RiscossioniListFilters,
  type StatoRiscossione,
} from './riscossione.model';

const PAGE_SIZE = 25;

interface ListFilters {
  search: string;
  stato: StatoRiscossione | '';
  dataDa: string;
  dataA: string;
}

/** Filtri di default: `dataDa` a 7 giorni fa (ultima settimana). */
const defaultFilters = (): ListFilters => ({ search: '', stato: '', dataDa: daysAgoIso(7), dataA: '' });

@Component({
  selector: 'lnk-riscossioni-list',
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
  templateUrl: './riscossioni-list.component.html',
})
export class RiscossioniListComponent implements OnInit {
  private readonly api = inject(RiscossioniApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['riscossioni'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'riscossioni',
        titleKey: 'Tweaks.Layout',
        rows: [
          { type: 'segmented', labelKey: 'Tweaks.View', hintKey: 'Tweaks.ViewHint',
            options: VIEW_OPTIONS, value: this.viewMode,
            onChange: (v) => this.onViewModeChange(v) },
          { type: 'segmented', labelKey: 'Tweaks.Range', hintKey: 'Tweaks.RangeHint',
            options: DATE_RANGE_OPTIONS,
            value: computed(() => matchDateRangePreset(this.filters().dataDa)),
            onChange: (v) => this.onDateRangeChange(v) },
        ],
        onReset: () => this.viewModeOverride.set(null),
      })
    );
  }

  readonly rowConfig = toSignal(
    this.displayConfigLoader.load('assets/config/riscossioni-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'riscossioni';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'data', direction: 'desc' });
  readonly rows = signal<Riscossione[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(defaultFilters());
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    const d = defaultFilters();
    return f.search !== d.search || f.stato !== d.stato || f.dataDa !== d.dataDa || f.dataA !== d.dataA;
  });
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly statoOptions: SelectOption[] = (
    Object.keys(STATO_RISCOSSIONE_LABEL) as StatoRiscossione[]
  ).map((s) => ({ value: s, labelKey: STATO_RISCOSSIONE_LABEL[s] }));

  readonly columns = computed<ColumnDef<Riscossione>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Riscossione>(tableCfg.columns);
    return [
    { key: 'iur', header: 'Riscossioni.Columns.Iur', cellClass: 'font-mono text-xs', width: '12rem' },
    {
      key: 'iuv',
      header: 'Riscossioni.Columns.Iuv',
      cellClass: 'font-mono text-xs',
      sortable: true,
      width: '14rem',
    },
    {
      key: 'idDominio',
      header: 'Riscossioni.Columns.Dominio',
      format: (r) => truncate(r.idDominio),
      width: '11rem',
    },
    {
      key: 'tipo',
      header: 'Riscossioni.Columns.Tipo',
      format: (r) => r.tipo,
      width: '8rem',
    },
    {
      key: 'data',
      header: 'Riscossioni.Columns.DataRiscossione',
      format: (r) => formatDate(r.data),
      sortable: true,
      width: '8rem',
    },
    {
      key: 'importo',
      header: 'Riscossioni.Columns.Importo',
      format: (r) => formatEuro(r.importo),
      align: 'right',
      cellClass: 'font-mono',
      width: '8rem',
    },
    {
      key: 'stato',
      header: 'Riscossioni.Columns.Stato',
      cellType: 'badge',
      cellTone: (r) => STATO_RISCOSSIONE_COLOR[r.stato] ?? 'muted',
      format: (r) => STATO_RISCOSSIONE_LABEL[r.stato] ?? r.stato,
      sortable: true,
      width: '9rem',
    },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Riscossioni' }]);
    // Ripristina filtri e ordinamento dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters; sort: SortEvent | null }>(RiscossioniListComponent.STATE_KEY);
    if (saved) {
      this.filters.set(saved.filters);
      if (saved.sort) this.sort.set(saved.sort);
    }
    this.reset();
  }

  onSortChange(s: SortEvent): void { this.sort.set(s); this.reset(); }
  refresh(): void { this.reset(); }
  onRowClick(r: Riscossione): void {
    this.router.navigate(['/riscossioni', r.idDominio, r.iuv, r.iur, r.indice]);
  }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }
  onSearchChange(v: string): void { this.filters.update((f) => ({ ...f, search: v })); this.reset(); }
  onStatoChange(v: string): void { this.filters.update((f) => ({ ...f, stato: v as StatoRiscossione | '' })); this.reset(); }
  onDataDaChange(v: string): void { this.filters.update((f) => ({ ...f, dataDa: v })); this.reset(); }
  onDataAChange(v: string): void { this.filters.update((f) => ({ ...f, dataA: v })); this.reset(); }
  resetFilters(): void { this.filters.set(defaultFilters()); this.reset(); }

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

  private reset(): void {
    // Persisti filtri/ordinamento per il ripristino al return dal detail.
    this.listState.set(RiscossioniListComponent.STATE_KEY, {
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
    const filters: RiscossioniListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
      // ordinamento: formatOrdinamento(this.sort()),
      stato: f.stato || undefined,
      iur: f.search || undefined,
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
        if (append) this.rows.update((prev) => [...prev, ...results]);
        else this.rows.set(results);
        this.total.set(page.numRisultati ?? 0);
        this.loading.set(false);
      });
  }

}
