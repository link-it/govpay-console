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
  SelectInputComponent,
  VIEW_OPTIONS,
  columnsFromConfig,
  type ColumnDef,
  type SelectOption,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { ApplicazioniApi } from './applicazioni.api';
import type { Applicazione, ApplicazioniListFilters } from './applicazione.model';

const PAGE_SIZE = 25;

interface ListFilters {
  abilitato: '' | 'true' | 'false';
}

const EMPTY_FILTERS: ListFilters = { abilitato: '' };

@Component({
  selector: 'lnk-applicazioni-list',
  standalone: true,
  imports: [
    TranslatePipe,
    PageHeaderComponent,
    DataTableComponent,
    ItemListComponent,
    EmptyStateComponent,
    InfiniteScrollDirective,
    SelectInputComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applicazioni-list.component.html',
})
export class ApplicazioniListComponent implements OnInit {
  private readonly api = inject(ApplicazioniApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['applicazioni'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'applicazioni',
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
    this.displayConfigLoader.load('assets/config/applicazioni-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'applicazioni';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly page = signal(1);
  readonly rows = signal<Applicazione[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(EMPTY_FILTERS);
  readonly hasActiveFilters = computed(() => !!this.filters().abilitato);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly booleanOptions: SelectOption[] = [
    { value: 'true', labelKey: 'Common.Yes' },
    { value: 'false', labelKey: 'Common.No' },
  ];

  readonly columns = computed<ColumnDef<Applicazione>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Applicazione>(tableCfg.columns);
    return [
      { key: 'idA2A', header: 'Applicazioni.Columns.IdA2A', cellClass: 'font-mono text-xs' },
      { key: 'principal', header: 'Applicazioni.Columns.Principal', cellClass: 'font-mono text-xs' },
      {
        key: 'abilitato',
        header: 'Applicazioni.Columns.Abilitato',
        cellType: 'badge',
        cellTone: (a) => (a.abilitato ? 'success' : 'muted'),
        format: (a) => (a.abilitato ? this.translate.instant('Common.Yes') : this.translate.instant('Common.No')),
        width: '8rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Applicazioni' }]);
    // Ripristina filtri dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters }>(ApplicazioniListComponent.STATE_KEY);
    if (saved) this.filters.set(saved.filters);
    this.reset();
  }

  refresh(): void { this.reset(); }
  onRowClick(a: Applicazione): void { this.router.navigate(['/applicazioni', a.idA2A]); }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }
  onAbilitatoChange(v: string): void { this.filters.update((f) => ({ ...f, abilitato: v as ListFilters['abilitato'] })); this.reset(); }
  resetFilters(): void { this.filters.set(EMPTY_FILTERS); this.reset(); }

  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  private reset(): void {
    // Persisti filtri/ordinamento per il ripristino al return dal detail.
    this.listState.set(ApplicazioniListComponent.STATE_KEY, {
      filters: this.filters(),
    });
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);
    const f = this.filters();
    const filters: ApplicazioniListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
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
