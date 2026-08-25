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
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, type Observable } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade, SnackbarService } from '@linkit/shared-ui';
import {
  DataTableComponent,
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  InfiniteScrollDirective,
  PageHeaderComponent,
  StatusBadgeComponent,
  formatDateTime,
  type ColumnDef,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail, sliceHasMore, type Slice } from '@core/models';
import { OperazioniConsoleApi } from './operazioni.console-api';
import {
  STATO_ESECUZIONE_COLOR,
  STATO_ESECUZIONE_LABEL,
  type EsecuzioneSummary,
  type Operazione,
} from './operazione.model';

const PAGE_SIZE = 25;

@Component({
  selector: 'lnk-operazione-detail',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    InfoGridComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
    InfiniteScrollDirective,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operazione-detail.component.html',
})
export class OperazioneDetailComponent implements OnInit {
  private readonly api = inject(OperazioniConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private id = '';
  readonly operazione = signal<Operazione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly avviando = signal(false);

  private readonly page = signal(1);
  readonly esecuzioni = signal<EsecuzioneSummary[]>([]);
  readonly esecuzioniLoading = signal(false);
  readonly esecuzioniHasMore = signal(false);
  readonly esecuzioniCanLoadMore = computed(() => this.esecuzioniHasMore() && !this.esecuzioniLoading());

  readonly metaItems = computed<InfoGridItem[]>(() => {
    const o = this.operazione();
    if (!o) return [];
    return [
      { labelKey: 'Operazioni.Detail.Id', value: o.id, mono: true },
      { labelKey: 'Operazioni.Detail.Nome', value: o.nome },
      { labelKey: 'Operazioni.Detail.Descrizione', value: o.descrizione ?? undefined, wide: true, hide: !o.descrizione },
      { labelKey: 'Operazioni.Detail.Frequenza', value: o.frequenzaSchedulata ?? undefined, mono: true, hide: !o.frequenzaSchedulata },
      { labelKey: 'Operazioni.Detail.ProssimaEsecuzione', value: o.prossimaEsecuzione ? formatDateTime(o.prossimaEsecuzione) : undefined, hide: !o.prossimaEsecuzione },
      { labelKey: 'Operazioni.Detail.Abilitata', value: this.translate.instant(o.abilitata ? 'Common.Yes' : 'Common.No') },
      { labelKey: 'Operazioni.Detail.LockAttivo', value: this.translate.instant(o.lockAttivo ? 'Common.Yes' : 'Common.No'), hide: o.lockAttivo == null },
    ];
  });

  readonly esecuzioniColumns = computed<ColumnDef<EsecuzioneSummary>[]>(() => [
    { key: 'idEsecuzione', header: 'Operazioni.Esecuzioni.Columns.Id', format: (e) => e.idEsecuzione, cellClass: 'font-mono text-xs' },
    { key: 'dataInizio', header: 'Operazioni.Esecuzioni.Columns.Inizio', format: (e) => formatDateTime(e.dataInizio), width: '12rem' },
    { key: 'dataFine', header: 'Operazioni.Esecuzioni.Columns.Fine', format: (e) => (e.dataFine ? formatDateTime(e.dataFine) : '—'), width: '12rem' },
    {
      key: 'stato',
      header: 'Operazioni.Esecuzioni.Columns.Stato',
      cellType: 'badge',
      cellTone: (e) => STATO_ESECUZIONE_COLOR[e.stato] ?? 'muted',
      format: (e) => STATO_ESECUZIONE_LABEL[e.stato] ?? e.stato,
      width: '10rem',
    },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idOperazione');
    if (!id) {
      this.router.navigate(['/operazioni']);
      return;
    }
    this.id = id;
    this.system.setBreadcrumbs([
      { label: 'Nav.Operazioni', url: '/operazioni' },
      { label: id },
    ]);
    this.fetch();
    this.fetchEsecuzioni(false);
  }

  /** L'operazione arriva dal catalogo (niente GET by-id): filtra per id. */
  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list()
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of<Operazione[]>([]);
        })
      )
      .subscribe((ops) => {
        this.operazione.set(ops.find((o) => o.id === this.id) ?? null);
        this.loading.set(false);
      });
  }

  loadMoreEsecuzioni(): void {
    if (!this.esecuzioniCanLoadMore()) return;
    this.page.update((p) => p + 1);
    this.fetchEsecuzioni(true);
  }

  private fetchEsecuzioni(append: boolean): void {
    this.esecuzioniLoading.set(true);
    this.api
      .listEsecuzioni(this.id, { page: this.page(), limit: PAGE_SIZE })
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of<Slice<EsecuzioneSummary>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const results = slice.results ?? [];
        if (append) this.esecuzioni.update((prev) => [...prev, ...results]);
        else this.esecuzioni.set(results);
        this.esecuzioniHasMore.set(sliceHasMore(slice));
        this.esecuzioniLoading.set(false);
      });
  }

  onEsecuzioneClick(e: EsecuzioneSummary): void {
    this.router.navigate(['/operazioni', this.id, 'esecuzioni', e.idEsecuzione]);
  }

  avvia(force: boolean): void {
    if (this.avviando()) return;
    this.avviando.set(true);
    this.run(this.api.avvia(this.id, { force }));
  }

  private run(source: Observable<{ idEsecuzione: string }>): void {
    source
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Operazioni.Detail.AvviaErrore')));
          return of(null);
        })
      )
      .subscribe((esecuzione) => {
        this.avviando.set(false);
        if (!esecuzione) return;
        this.snackbar.success(this.translate.instant('Operazioni.Detail.AvviaSuccesso'));
        this.router.navigate(['/operazioni', this.id, 'esecuzioni', esecuzione.idEsecuzione]);
      });
  }
}
