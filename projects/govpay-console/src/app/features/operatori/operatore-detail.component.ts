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
  type InfoGridItem,
} from '@shared';
import { OperatoriApi } from './operatori.api';
import type { Operatore } from './operatore.model';

@Component({
  selector: 'lnk-operatore-detail',
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
  templateUrl: './operatore-detail.component.html',
})
export class OperatoreDetailComponent implements OnInit {
  private readonly api = inject(OperatoriApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly operatore = signal<Operatore | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly abilitatoTone = computed(() => (this.operatore()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.operatore()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const o = this.operatore();
    if (!o) return [];
    return [
      { labelKey: 'Operatori.Detail.Principal', value: o.principal, mono: true },
      { labelKey: 'Operatori.Detail.RagioneSociale', value: o.ragioneSociale, wide: true },
    ];
  });

  readonly dominiList = computed<string[]>(() => {
    const ds = this.operatore()?.domini ?? [];
    return ds.map((d) => (typeof d === 'string' ? d : d.idDominio));
  });

  ngOnInit(): void {
    const principal = this.route.snapshot.paramMap.get('principal');
    if (!principal) {
      this.router.navigate(['/operatori']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Operatori', url: '/operatori' },
      { label: principal },
    ]);
    this.fetch(principal);
  }

  private fetch(principal: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(principal)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((o) => {
        this.operatore.set(o);
        this.loading.set(false);
      });
  }
}
