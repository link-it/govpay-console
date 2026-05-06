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
import { SystemFacade } from '@core/system';
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
  VIEW_OPTIONS,
  columnsFromConfig,
  truncate,
  type ColumnDef,
} from '@shared';
import { TweaksRegistry } from '@core/ui';
import { IntermediariApi } from './intermediari.api';
import type { Intermediario, IntermediariListFilters } from './intermediario.model';

const PAGE_SIZE = 25;

@Component({
  selector: 'lnk-intermediari-list',
  standalone: true,
  imports: [
    TranslatePipe,
    PageHeaderComponent,
    DataTableComponent,
    ItemListComponent,
    EmptyStateComponent,
    InfiniteScrollDirective,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intermediari-list.component.html',
})
export class IntermediariListComponent implements OnInit {
  private readonly api = inject(IntermediariApi);
  private readonly cfgSvc = inject(ConfigService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  private readonly viewModeDefault = computed<'table' | 'rows'>(() => {
    const layout = this.cfgSvc.appConfig()?.Layout;
    return layout?.listViewByFeature?.['intermediari'] ?? layout?.listView ?? 'table';
  });
  private readonly viewModeOverride = signal<'table' | 'rows' | null>(null);
  readonly viewMode = computed<'table' | 'rows'>(
    () => this.viewModeOverride() ?? this.viewModeDefault()
  );

  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'intermediari',
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
    this.displayConfigLoader.load('assets/config/intermediari-config.json').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly page = signal(1);
  readonly rows = signal<Intermediario[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasMore = computed(() => this.rows().length < this.total());
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());
  readonly canLoadMore = computed(() => this.hasMore() && !this.loading());

  readonly columns = computed<ColumnDef<Intermediario>[]>(() => {
    const tableCfg = this.rowConfig()?.table;
    if (tableCfg?.columns?.length) return columnsFromConfig<Intermediario>(tableCfg.columns);
    return [
      { key: 'idIntermediario', header: 'Intermediari.Columns.IdIntermediario', cellClass: 'font-mono text-xs', width: '12rem' },
      { key: 'denominazione', header: 'Intermediari.Columns.Denominazione', format: (i) => truncate(i.denominazione) },
      {
        key: 'abilitato',
        header: 'Intermediari.Columns.Abilitato',
        cellType: 'badge',
        cellTone: (i) => (i.abilitato ? 'success' : 'muted'),
        format: (i) => (i.abilitato ? this.translate.instant('Common.Yes') : this.translate.instant('Common.No')),
        width: '8rem',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.RegistroIntermediari' }]);
    this.reset();
  }

  refresh(): void { this.reset(); }
  onRowClick(i: Intermediario): void {
    if (i.idIntermediario) this.router.navigate(['/registro-intermediari', i.idIntermediario]);
  }
  loadMore(): void {
    if (!this.canLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetch(true);
  }

  onViewModeChange(value: string): void {
    this.viewModeOverride.set(value === 'rows' ? 'rows' : 'table');
  }

  private reset(): void {
    this.page.set(1);
    this.rows.set([]);
    this.fetch(false);
  }

  private fetch(append: boolean): void {
    this.loading.set(true);
    this.error.set(null);
    const filters: IntermediariListFilters = {
      pagina: this.page(),
      risPerPagina: PAGE_SIZE,
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
