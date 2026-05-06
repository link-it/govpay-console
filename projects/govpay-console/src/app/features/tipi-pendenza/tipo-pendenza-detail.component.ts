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
import { TipiPendenzaApi } from './tipi-pendenza.api';
import type { TipoPendenza } from './tipo-pendenza.model';

@Component({
  selector: 'lnk-tipo-pendenza-detail',
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
  templateUrl: './tipo-pendenza-detail.component.html',
})
export class TipoPendenzaDetailComponent implements OnInit {
  private readonly api = inject(TipiPendenzaApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly tipo = signal<TipoPendenza | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly abilitatoTone = computed(() => (this.tipo()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.tipo()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const t = this.tipo();
    if (!t) return [];
    return [
      { labelKey: 'TipiPendenza.Detail.IdTipoPendenza', value: t.idTipoPendenza, mono: true },
      { labelKey: 'TipiPendenza.Detail.Descrizione', value: t.descrizione, wide: true },
      { labelKey: 'TipiPendenza.Detail.CodificaIUV', value: t.codificaIUV, mono: true, hide: !t.codificaIUV },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idTipoPendenza');
    if (!id) {
      this.router.navigate(['/tipi-pendenza']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.TipiPendenza', url: '/tipi-pendenza' },
      { label: id },
    ]);
    this.fetch(id);
  }

  formatJson(payload: Record<string, unknown> | undefined): string {
    if (!payload) return '';
    return JSON.stringify(payload, null, 2);
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
      .subscribe((t) => {
        this.tipo.set(t);
        this.loading.set(false);
      });
  }
}
