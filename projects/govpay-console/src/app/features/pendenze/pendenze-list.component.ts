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
import { ConfigService } from '@linkit/shared-ui';
import { ListStateService, SystemFacade } from '@linkit/shared-ui';
import { SnackbarService } from '@linkit/shared-ui';
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
  formatDate,
  formatEuro,
  formatOrdinamento,
  truncate,
  type ColumnDef,
  type SelectOption,
  type SortEvent,
} from '@linkit/shared-ui';
import { TweaksRegistry } from '@linkit/shared-ui';
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

/**
 * Filtri di lista Fase 1 API V2: i **4 filtri supportati** (campi dedicati).
 * I filtri V1 `stato`/`dataDa`/`dataA` sono rimossi (la API risponde 400).
 */
interface ListFilters {
  idPendenza: string;
  numeroAvviso: string;
  idDominio: string;
  identificativoDebitore: string;
}

const defaultFilters = (): ListFilters => ({
  idPendenza: '',
  numeroAvviso: '',
  idDominio: '',
  identificativoDebitore: '',
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

  /**
   * Opzioni del select "Ente creditore" (`idDominio`) dai domini in scope
   * dell'utente (`AuthService.user().domini`), escluso il placeholder `*`
   * (= tutti → nessun filtro).
   */
  readonly dominiOptions = computed<SelectOption[]>(() =>
    (this.auth.user()?.domini ?? [])
      .filter((d) => d.idDominio && d.idDominio !== '*')
      .map((d) => ({ value: d.idDominio, label: d.ragioneSociale || d.idDominio }))
  );

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
        ],
        onReset: () => this.viewModeOverride.set(null),
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
  /**
   * Totale risultati (`pagination.totalResults`), richiesto con `total=true`
   * solo sulla prima pagina. `null` finché non arriva (o se non disponibile).
   */
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = signal<ListFilters>(defaultFilters());
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.idPendenza || f.numeroAvviso || f.idDominio || f.identificativoDebitore);
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

  onIdPendenzaChange(value: string): void {
    this.filters.update((f) => ({ ...f, idPendenza: value }));
    this.reset();
  }

  onNumeroAvvisoChange(value: string): void {
    this.filters.update((f) => ({ ...f, numeroAvviso: value }));
    this.reset();
  }

  onIdDominioChange(value: string): void {
    this.filters.update((f) => ({ ...f, idDominio: value }));
    this.reset();
  }

  onIdentificativoDebitoreChange(value: string): void {
    this.filters.update((f) => ({ ...f, identificativoDebitore: value }));
    this.reset();
  }

  resetFilters(): void {
    this.filters.set(defaultFilters());
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
      page: this.page(),
      limit: PAGE_SIZE,
      sort: formatOrdinamento(this.sort()),
      // Richiedi il conteggio totale solo sulla prima pagina: non cambia tra
      // gli append dell'infinite scroll ed evita una COUNT extra per pagina.
      total: append ? undefined : true,
      idPendenza: f.idPendenza || undefined,
      numeroAvviso: f.numeroAvviso || undefined,
      idDominio: f.idDominio || undefined,
      identificativoDebitore: f.identificativoDebitore || undefined,
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
