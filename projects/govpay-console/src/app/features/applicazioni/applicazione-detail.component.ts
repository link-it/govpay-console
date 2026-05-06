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
import { ApplicazioniApi } from './applicazioni.api';
import type { Applicazione } from './applicazione.model';

@Component({
  selector: 'lnk-applicazione-detail',
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
  templateUrl: './applicazione-detail.component.html',
})
export class ApplicazioneDetailComponent implements OnInit {
  private readonly api = inject(ApplicazioniApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly applicazione = signal<Applicazione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly abilitatoTone = computed(() => (this.applicazione()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.applicazione()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const a = this.applicazione();
    if (!a) return [];
    return [
      { labelKey: 'Applicazioni.Detail.IdA2A', value: a.idA2A, mono: true },
      { labelKey: 'Applicazioni.Detail.Principal', value: a.principal, mono: true },
    ];
  });

  readonly apiItems = computed<InfoGridItem[]>(() => {
    const a = this.applicazione();
    if (!a) return [];
    const yn = (b?: boolean): string => (b ? this.translate.instant('Common.Yes') : this.translate.instant('Common.No'));
    return [
      { labelKey: 'Applicazioni.Detail.ApiPagamenti', value: yn(a.apiPagamenti) },
      { labelKey: 'Applicazioni.Detail.ApiPendenze', value: yn(a.apiPendenze) },
      { labelKey: 'Applicazioni.Detail.ApiRagioneria', value: yn(a.apiRagioneria) },
    ];
  });

  readonly dominiList = computed<string[]>(() => {
    const ds = this.applicazione()?.domini ?? [];
    return ds.map((d) => (typeof d === 'string' ? d : d.idDominio));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idA2A');
    if (!id) {
      this.router.navigate(['/applicazioni']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Applicazioni', url: '/applicazioni' },
      { label: id },
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
      .subscribe((a) => {
        this.applicazione.set(a);
        this.loading.set(false);
      });
  }
}
