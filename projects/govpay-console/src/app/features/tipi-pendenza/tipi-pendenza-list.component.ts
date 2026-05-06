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
  DisplayConfigLoader,
  EmptyStateComponent,
  LoadingComponent,
  InfiniteScrollDirective,
  ListStickyToolbarDirective,
  ItemListComponent,
  PageHeaderComponent,
  SearchInputComponent,
  SelectInputComponent,
  VIEW_OPTIONS,
  columnsFromConfig,
  formatOrdinamento,
  truncate,
  type ColumnDef,
  type SelectOption,
  type SortEvent,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { TipiPendenzaApi } from './tipi-pendenza.api';
import type { TipoPendenza, TipiPendenzaListFilters } from './tipo-pendenza.model';

const PAGE_SIZE = 25;

interface ListFilters {
  search: string;
  abilitato: '' | 'true' | 'false';
}

const EMPTY_FILTERS: ListFilters = { search: '', abilitato: '' };

@Component({
  selector: 'lnk-tipi-pendenza-list',
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
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipi-pendenza-list.component.html',
})
export class TipiPendenzaListComponent implements OnInit {
  private readonly api = inject(TipiPendenzaApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['tipi-pendenza'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'tipi-pendenza',
        titleKey: 'Tweaks.Layout',
        rows: [
          { type: 'segmented', labelKey: 'Tweaks.View', hintKey: 'Tweaks.ViewHint',
            options: VIEW_OPTIONS, value: this.viewMode,
            onChange: (v) => this.onViewModeChange(v) },
        ],
        onReset: () => this.viewModeOverride.set(null),
      })
    );
  }

  readonly rowConfig = toSignal(
    this.displayConfigLoader.load('assets/config/tipi-pendenza-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'tipi-pendenza';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'idEntrata', direction: 'asc' });
  readonly rows = signal<TipoPendenza[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(EMPTY_FILTERS);
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.search || f.abilitato);
  });
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly booleanOptions: SelectOption[] = [
    { value: 'true', labelKey: 'Common.Yes' },
    { value: 'false', labelKey: 'Common.No' },
  ];

  readonly columns = computed<ColumnDef<TipoPendenza>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<TipoPendenza>(tableCfg.columns);
    return [
    {
      key: 'idTipoPendenza',
      header: 'TipiPendenza.Columns.IdTipoPendenza',
      cellClass: 'font-mono text-xs',
      width: '12rem',
    },
    {
      key: 'descrizione',
      header: 'TipiPendenza.Columns.Descrizione',
      format: (t) => truncate(t.descrizione),
    },
    {
      key: 'codificaIUV',
      header: 'TipiPendenza.Columns.CodificaIUV',
      cellClass: 'font-mono text-xs',
      format: (t) => t.codificaIUV || '—',
      width: '8rem',
    },
    {
      key: 'pagaTerzi',
      header: 'TipiPendenza.Columns.PagaTerzi',
      cellType: 'badge',
      cellTone: (t) => (t.pagaTerzi ? 'info' : 'muted'),
      format: (t) => (t.pagaTerzi ? this.translate.instant('Common.Yes') : this.translate.instant('Common.No')),
      width: '8rem',
    },
    {
      key: 'abilitato',
      header: 'TipiPendenza.Columns.Abilitato',
      cellType: 'badge',
      cellTone: (t) => (t.abilitato ? 'success' : 'muted'),
      format: (t) => (t.abilitato ? this.translate.instant('Common.Yes') : this.translate.instant('Common.No')),
      width: '8rem',
    },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.TipiPendenza' }]);
    // Ripristina filtri e ordinamento dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters; sort: SortEvent | null }>(TipiPendenzaListComponent.STATE_KEY);
    if (saved) {
      this.filters.set(saved.filters);
      if (saved.sort) this.sort.set(saved.sort);
    }
    this.reset();
  }

  onSortChange(s: SortEvent): void { this.sort.set(s); this.reset(); }
  refresh(): void { this.reset(); }
  onRowClick(t: TipoPendenza): void { this.router.navigate(['/tipi-pendenza', t.idTipoPendenza]); }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }
  onSearchChange(v: string): void { this.filters.update((f) => ({ ...f, search: v })); this.reset(); }
  onAbilitatoChange(v: string): void { this.filters.update((f) => ({ ...f, abilitato: v as ListFilters['abilitato'] })); this.reset(); }
  resetFilters(): void { this.filters.set(EMPTY_FILTERS); this.reset(); }

  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  private reset(): void {
    // Persisti filtri/ordinamento per il ripristino al return dal detail.
    this.listState.set(TipiPendenzaListComponent.STATE_KEY, {
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
    const filters: TipiPendenzaListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
      // ordinamento: formatOrdinamento(this.sort()),
      descrizione: f.search || undefined,
      abilitato: f.abilitato === '' ? undefined : f.abilitato === 'true',
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
