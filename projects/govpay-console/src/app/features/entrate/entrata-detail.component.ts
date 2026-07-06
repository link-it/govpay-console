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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  InfoGridComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  PageHeaderComponent,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { EntrateConsoleApi } from './entrate.console-api';
import type { Entrata } from './entrata.model';

@Component({
  selector: 'lnk-entrata-detail',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    InfoGridComponent,
    EmptyStateComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entrata-detail.component.html',
})
export class EntrataDetailComponent implements OnInit {
  private readonly api = inject(EntrateConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idEntrata = '';

  readonly entrata = signal<Entrata | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const e = this.entrata();
    if (!e) return [];
    return [
      { labelKey: 'Entrate.Detail.IdEntrata', value: e.idEntrata, mono: true },
      { labelKey: 'Entrate.Detail.Descrizione', value: e.descrizione, wide: true },
      { labelKey: 'Entrate.Detail.TipoContabilita', value: this.translate.instant('Entrate.TipoContabilita.' + e.tipoContabilita) },
      { labelKey: 'Entrate.Detail.CodiceContabilita', value: e.codiceContabilita, mono: true },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idEntrata');
    if (!id) {
      this.router.navigate(['/entrate']);
      return;
    }
    this.idEntrata = id;
    this.system.setBreadcrumbs([{ label: 'Nav.Entrate', url: '/entrate' }, { label: id }]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idEntrata)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((e) => {
        this.entrata.set(e);
        this.loading.set(false);
      });
  }
}
