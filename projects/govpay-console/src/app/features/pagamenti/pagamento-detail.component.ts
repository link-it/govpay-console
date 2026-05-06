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
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@core/system';
import { SnackbarService } from '@core/ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  formatDateTime,
  formatEuro,
  truncate,
  type InfoGridItem,
} from '@shared';
import { PagamentiApi } from './pagamenti.api';
import { STATO_PAGAMENTO_COLOR, STATO_PAGAMENTO_LABEL, type Pagamento } from './pagamento.model';

@Component({
  selector: 'lnk-pagamento-detail',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagamento-detail.component.html',
})
export class PagamentoDetailComponent implements OnInit {
  private readonly api = inject(PagamentiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly pagamento = signal<Pagamento | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly title = computed(() => truncate(this.pagamento()?.id, 16) || '—');

  readonly statoTone = computed(() => {
    const s = this.pagamento()?.stato;
    return s ? STATO_PAGAMENTO_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.pagamento()?.stato;
    return s ? STATO_PAGAMENTO_LABEL[s] : 'Pagamenti.Stati.InCorso';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const p = this.pagamento();
    if (!p) return [];
    return [
      { labelKey: 'Pagamenti.Detail.Id', value: p.id, mono: true, wide: true },
      { labelKey: 'Pagamenti.Detail.DataRichiesta', value: formatDateTime(p.dataRichiestaPagamento) },
      { labelKey: 'Pagamenti.Detail.Importo', value: formatEuro(p.importo) },
      {
        labelKey: 'Pagamenti.Detail.ImportoPagato',
        value: p.importoPagato !== undefined ? formatEuro(p.importoPagato) : null,
        hide: p.importoPagato === undefined,
      },
      {
        labelKey: 'Pagamenti.Detail.NumeroPendenze',
        value: (p.numeroPendenze ?? 1).toString(),
      },
      { labelKey: 'Pagamenti.Detail.Nodo', value: p.nodo, hide: !p.nodo },
    ];
  });

  readonly versanteItems = computed<InfoGridItem[]>(() => {
    const sv = this.pagamento()?.soggettoVersante;
    if (!sv) return [];
    return [
      { labelKey: 'Pagamenti.Detail.Anagrafica', value: sv.anagrafica, wide: true },
      { labelKey: 'Pagamenti.Detail.Identificativo', value: sv.identificativo, mono: true },
      { labelKey: 'Pagamenti.Detail.Email', value: sv.email, hide: !sv.email },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/pagamenti']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Pagamenti', url: '/pagamenti' },
      { label: truncate(id, 12) },
    ]);
    this.fetch(id);
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(id)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((p) => {
        this.pagamento.set(p);
        this.loading.set(false);
      });
  }
}
