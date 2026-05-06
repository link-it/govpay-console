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
  formatDateTime,
  formatOrdinamento,
  matchDateRangePreset,
  truncate,
  type ColumnDef,
  type SelectOption,
  type SortEvent,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { GiornaleEventiApi } from './giornale-eventi.api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  severitaToEsito,
  type CategoriaEvento,
  type EsitoEvento,
  type Evento,
  type GiornaleEventiListFilters,
} from './evento.model';

const PAGE_SIZE = 25;

interface ListFilters {
  search: string;
  esito: EsitoEvento | '';
  categoria: CategoriaEvento | '';
  dataDa: string;
  dataA: string;
}

/**
 * Filtri di default: `dataDa` a 1 giorno fa (ultime 24 ore con
 * granularità giornaliera del `<lnk-date-input>`).
 */
const defaultFilters = (): ListFilters => ({
  search: '',
  esito: '',
  categoria: '',
  dataDa: daysAgoIso(1),
  dataA: '',
});

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
    SearchInputComponent,
    SelectInputComponent,
    DateInputComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './giornale-eventi-list.component.html',
})
export class GiornaleEventiListComponent implements OnInit {
  private readonly api = inject(GiornaleEventiApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['giornale-eventi'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'giornale-eventi',
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
    this.displayConfigLoader.load('assets/config/giornale-eventi-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'giornale-eventi';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly page = signal(1);
  /** `/eventi` non supporta `ordinamento`: il default lato server è data desc. */
  readonly sort = signal<SortEvent | null>(null);
  readonly rows = signal<Evento[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(defaultFilters());
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    const d = defaultFilters();
    return f.search !== d.search || f.esito !== d.esito || f.categoria !== d.categoria || f.dataDa !== d.dataDa || f.dataA !== d.dataA;
  });
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly esitoOptions: SelectOption[] = (
    Object.keys(ESITO_EVENTO_LABEL) as EsitoEvento[]
  ).map((s) => ({ value: s, labelKey: ESITO_EVENTO_LABEL[s] }));

  readonly categoriaOptions: SelectOption[] = (
    Object.keys(CATEGORIA_EVENTO_LABEL) as CategoriaEvento[]
  ).map((s) => ({ value: s, labelKey: CATEGORIA_EVENTO_LABEL[s] }));

  readonly columns = computed<ColumnDef<Evento>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Evento>(tableCfg.columns);
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
      key: 'durataEvento',
      header: 'GiornaleEventi.Columns.Durata',
      format: (r) => (r.durataEvento != null ? `${r.durataEvento} ms` : '—'),
      align: 'right',
      cellClass: 'font-mono text-xs',
      width: '6rem',
    },
    {
      key: 'esito',
      header: 'GiornaleEventi.Columns.Esito',
      cellType: 'badge',
      cellTone: (r) => ESITO_EVENTO_COLOR[r.esito ?? severitaToEsito(r.severita)] ?? 'muted',
      format: (r) => ESITO_EVENTO_LABEL[r.esito ?? severitaToEsito(r.severita)] ?? '—',
      width: '7rem',
    },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.GiornaleEventi' }]);
    // Ripristina filtri e ordinamento dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters; sort: SortEvent | null }>(GiornaleEventiListComponent.STATE_KEY);
    if (saved) {
      this.filters.set(saved.filters);
      if (saved.sort) this.sort.set(saved.sort);
    }
    this.reset();
  }

  onSortChange(s: SortEvent): void { this.sort.set(s); this.reset(); }
  refresh(): void { this.reset(); }
  onRowClick(e: Evento): void {
    if (e.id != null) this.router.navigate(['/giornale-eventi', e.id]);
  }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }
  onSearchChange(v: string): void { this.filters.update((f) => ({ ...f, search: v })); this.reset(); }
  onEsitoChange(v: string): void { this.filters.update((f) => ({ ...f, esito: v as EsitoEvento | '' })); this.reset(); }
  onCategoriaChange(v: string): void { this.filters.update((f) => ({ ...f, categoria: v as CategoriaEvento | '' })); this.reset(); }
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
    this.listState.set(GiornaleEventiListComponent.STATE_KEY, {
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
    const filters: GiornaleEventiListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
      // ordinamento: formatOrdinamento(this.sort()),
      esito: f.esito || undefined,
      categoriaEvento: f.categoria || undefined,
      iuv: f.search || undefined,
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
