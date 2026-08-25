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
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade, SnackbarService } from '@linkit/shared-ui';
import {
  DataTableComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  PageHeaderComponent,
  formatDateTime,
  truncate,
  type ColumnDef,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { OperazioniConsoleApi } from './operazioni.console-api';
import {
  STATO_ESECUZIONE_COLOR,
  STATO_ESECUZIONE_LABEL,
  type Operazione,
} from './operazione.model';

@Component({
  selector: 'lnk-operazioni-list',
  standalone: true,
  imports: [
    TranslatePipe,
    PageHeaderComponent,
    DataTableComponent,
    EmptyStateComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operazioni-list.component.html',
})
export class OperazioniListComponent implements OnInit {
  private readonly api = inject(OperazioniConsoleApi);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly rows = signal<Operazione[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasRows = computed(() => this.rows().length > 0);
  readonly showEmptyState = computed(() => !this.loading() && !this.error() && !this.hasRows());

  readonly columns = computed<ColumnDef<Operazione>[]>(() => [
    { key: 'id', header: 'Operazioni.Columns.Id', format: (o) => o.id, cellClass: 'font-mono text-xs', width: '7rem' },
    { key: 'nome', header: 'Operazioni.Columns.Nome', format: (o) => o.nome },
    { key: 'descrizione', header: 'Operazioni.Columns.Descrizione', format: (o) => truncate(o.descrizione || '—', 70) },
    { key: 'frequenzaSchedulata', header: 'Operazioni.Columns.Frequenza', format: (o) => o.frequenzaSchedulata || '—', cellClass: 'font-mono text-xs', width: '7rem' },
    {
      key: 'ultimaEsecuzione',
      header: 'Operazioni.Columns.UltimaEsecuzione',
      cellType: 'badge',
      cellTone: (o) => (o.ultimaEsecuzione ? STATO_ESECUZIONE_COLOR[o.ultimaEsecuzione.stato] ?? 'muted' : 'muted'),
      format: (o) => (o.ultimaEsecuzione ? STATO_ESECUZIONE_LABEL[o.ultimaEsecuzione.stato] : '—'),
      width: '10rem',
    },
    {
      key: 'prossimaEsecuzione',
      header: 'Operazioni.Columns.ProssimaEsecuzione',
      format: (o) => (o.prossimaEsecuzione ? formatDateTime(o.prossimaEsecuzione) : '—'),
      width: '11rem',
    },
    {
      key: 'abilitata',
      header: 'Operazioni.Columns.Abilitata',
      cellType: 'badge',
      cellTone: (o) => (o.abilitata ? 'success' : 'muted'),
      format: (o) => this.translate.instant(o.abilitata ? 'Common.Yes' : 'Common.No'),
      width: '7rem',
    },
  ]);

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Operazioni' }]);
    this.fetch();
  }

  refresh(): void { this.fetch(); }

  onRowClick(o: Operazione): void {
    if (!o.id) return;
    this.router.navigate(['/operazioni', o.id]);
  }

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
        this.rows.set(ops);
        this.loading.set(false);
      });
  }
}
