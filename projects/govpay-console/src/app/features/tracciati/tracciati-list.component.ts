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
  formatDateTime,
  truncate,
  type ColumnDef,
  type SelectOption,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { TracciatiApi } from './tracciati.api';
import {
  STATO_TRACCIATO_COLOR,
  STATO_TRACCIATO_LABEL,
  type StatoTracciato,
  type Tracciato,
  type TracciatiListFilters,
} from './tracciato.model';

const PAGE_SIZE = 25;

interface ListFilters {
  stato: StatoTracciato | '';
}

const EMPTY_FILTERS: ListFilters = { stato: '' };

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
    SelectInputComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracciati-list.component.html',
})
export class TracciatiListComponent implements OnInit {
  private readonly api = inject(TracciatiApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['tracciati'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'tracciati',
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
    this.displayConfigLoader.load('assets/config/tracciati-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly listState = inject(ListStateService);
  private static readonly STATE_KEY = 'tracciati';
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly page = signal(1);
  readonly rows = signal<Tracciato[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(EMPTY_FILTERS);
  readonly hasActiveFilters = computed(() => !!this.filters().stato);
  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly statoOptions: SelectOption[] = (
    Object.keys(STATO_TRACCIATO_LABEL) as StatoTracciato[]
  ).map((s) => ({ value: s, labelKey: STATO_TRACCIATO_LABEL[s] }));

  readonly columns = computed<ColumnDef<Tracciato>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Tracciato>(tableCfg.columns);
    return [
    {
      key: 'nomeFile',
      header: 'Tracciati.Columns.NomeFile',
      cellClass: 'font-mono text-xs',
      format: (r) => truncate(r.nomeFile || `tracciato-${r.id}`, 40),
    },
    {
      key: 'dominio',
      header: 'Tracciati.Columns.Dominio',
      format: (r) => truncate(r.dominio?.ragioneSociale || r.dominio?.idDominio || '—'),
    },
    {
      key: 'dataOraCaricamento',
      header: 'Tracciati.Columns.DataCaricamento',
      format: (r) => formatDateTime(r.dataOraCaricamento),
      cellClass: 'font-mono text-xs',
      width: '12rem',
    },
    {
      key: 'dataOraUltimoAggiornamento',
      header: 'Tracciati.Columns.DataAggiornamento',
      format: (r) => (r.dataOraUltimoAggiornamento ? formatDateTime(r.dataOraUltimoAggiornamento) : '—'),
      cellClass: 'font-mono text-xs',
      width: '12rem',
    },
    {
      key: 'esito',
      header: 'Tracciati.Columns.Esito',
      format: (r) => {
        const ok = r.numeroOperazioniEseguite ?? 0;
        const ko = r.numeroOperazioniFallite ?? 0;
        const tot = r.numeroOperazioniTotali ?? ok + ko;
        return tot > 0 ? `${ok}/${tot}` : '—';
      },
      align: 'right',
      cellClass: 'font-mono text-xs',
      width: '7rem',
    },
    {
      key: 'operatoreMittente',
      header: 'Tracciati.Columns.Operatore',
      format: (r) => truncate(r.operatoreMittente || '—'),
    },
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
    // Ripristina filtri dopo back da dettaglio.
    const saved = this.listState.get<{ filters: ListFilters }>(TracciatiListComponent.STATE_KEY);
    if (saved) this.filters.set(saved.filters);
    this.reset();
  }

  refresh(): void { this.reset(); }
  onRowClick(t: Tracciato): void {
    this.router.navigate(['/tracciati', t.id]);
  }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }
  onStatoChange(v: string): void { this.filters.update((f) => ({ ...f, stato: v as StatoTracciato | '' })); this.reset(); }
  resetFilters(): void { this.filters.set(EMPTY_FILTERS); this.reset(); }

  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  private reset(): void {
    // Persisti filtri/ordinamento per il ripristino al return dal detail.
    this.listState.set(TracciatiListComponent.STATE_KEY, {
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
    const filters: TracciatiListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
      statoTracciatoPendenza: f.stato || undefined,
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
