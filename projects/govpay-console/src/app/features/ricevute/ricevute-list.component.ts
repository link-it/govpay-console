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
  DATE_RANGE_OPTIONS,
  VIEW_OPTIONS,
  columnsFromConfig,
  daysAgoIso,
  formatDateTime,
  formatEuro,
  formatOrdinamento,
  matchDateRangePreset,
  truncate,
  type ColumnDef,
  type SortEvent,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { RicevuteApi } from './ricevute.api';
import {
  STATO_RPP_COLOR,
  STATO_RPP_LABEL,
  type Ricevuta,
  type RicevuteListFilters,
} from './ricevuta.model';

const PAGE_SIZE = 25;

/**
 * La lista "Ricevute" mostra solo gli `esito = ESEGUITO` (filtro fisso lato API):
 * le RPP non andate a buon fine vengono comunque elencate sotto Pendenze.
 */
const ESITO_FISSO = 'ESEGUITO' as const;

interface ListFilters {
  search: string;
  dataDa: string;
  dataA: string;
}

/** Filtri di default: `dataDa` a 7 giorni fa (ultima settimana). */
const defaultFilters = (): ListFilters => ({
  search: '',
  dataDa: daysAgoIso(7),
  dataA: '',
});

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
    SearchInputComponent,
    DateInputComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ricevute-list.component.html',
})
export class RicevuteListComponent implements OnInit {
  private readonly api = inject(RicevuteApi);
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'ricevute';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.config.appConfig()?.Layout;
    return layout?.listViewByFeature?.['ricevute'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'ricevute',
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
    this.displayConfigLoader.load('assets/config/ricevute-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  private readonly page = signal(1);
  readonly sort = signal<SortEvent | null>({ key: 'dataRichiesta', direction: 'desc' });
  readonly rows = signal<Ricevuta[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(defaultFilters());
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    const d = defaultFilters();
    return f.search !== d.search || f.dataDa !== d.dataDa || f.dataA !== d.dataA;
  });

  readonly hasError = computed(() => this.error() !== null);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(
    () => !this.loading() && !this.hasError() && !this.hasRows()
  );
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<Ricevuta>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Ricevuta>(tableCfg.columns);
    return [
    {
      key: 'iuv',
      header: 'Ricevute.Columns.Iuv',
      cellClass: 'font-mono text-xs',
      format: (r) => r.pendenza?.iuvPagamento || r.pendenza?.iuvAvviso || '—',
      width: '12rem',
    },
    {
      key: 'dominio',
      header: 'Ricevute.Columns.Dominio',
      format: (r) => truncate(r.pendenza?.dominio?.ragioneSociale || r.pendenza?.dominio?.idDominio || ''),
    },
    {
      key: 'soggettoPagatore',
      header: 'Ricevute.Columns.Pagatore',
      format: (r) => truncate(r.pendenza?.soggettoPagatore?.anagrafica),
    },
    {
      key: 'causale',
      header: 'Ricevute.Columns.Causale',
      format: (r) => truncate(r.pendenza?.causale, 80),
    },
    {
      key: 'dataPagamento',
      header: 'Ricevute.Columns.DataRicevuta',
      format: (r) => {
        const dt = r.rt?.paymentDateTime || r.pendenza?.dataPagamento;
        return dt ? formatDateTime(dt) : '—';
      },
      width: '11rem',
    },
    {
      key: 'importo',
      header: 'Ricevute.Columns.Importo',
      format: (r) => formatEuro(r.pendenza?.importoPagato ?? r.pendenza?.importo),
      align: 'right',
      cellClass: 'font-mono',
      width: '8rem',
    },
    {
      key: 'stato',
      header: 'Ricevute.Columns.Stato',
      cellType: 'badge',
      cellTone: (r) => STATO_RPP_COLOR[r.stato] ?? 'muted',
      format: (r) => STATO_RPP_LABEL[r.stato] ?? r.stato,
      sortable: true,
      width: '10rem',
    },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Ricevute' }]);
    // Ripristina filtri e ordinamento dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters; sort: SortEvent | null }>(RicevuteListComponent.STATE_KEY);
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


  onRowClick(r: Ricevuta): void {
    const idDominio = r.pendenza?.dominio?.idDominio;
    const iuv = r.pendenza?.iuvPagamento || r.pendenza?.iuvAvviso;
    if (!idDominio || !iuv) return;
    // CCP: per pagamenti pagoPA v2 il CCP coincide con `rt.receiptId`
    // (vedi `govpay-console-github/util.service.ts:824,836-839`).
    // Se l'RT non c'è (es. RPT_SCADUTA) fallback al placeholder `n/a`.
    const ccp = r.rt?.receiptId || 'n/a';
    this.router.navigate(['/ricevute', idDominio, iuv, ccp]);
  }

  private reset(): void {
    // Persisti filtri/ordinamento per il ripristino al return dal detail.
    this.listState.set(RicevuteListComponent.STATE_KEY, {
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
    const filters: RicevuteListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
      // ordinamento: formatOrdinamento(this.sort()),
      // Filtro fisso: la lista mostra solo le RPP eseguite (RT acquisita).
      esito: ESITO_FISSO,
      iuv: f.search || undefined,
      // `/rpp` non accetta `dataDa/A`; il filtro UI si applica alla data RT.
      dataRtDa: f.dataDa ? `${f.dataDa}T00:00` : undefined,
      dataRtA: f.dataA ? `${f.dataA}T23:59` : undefined,
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
