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
import { IntermediariApi } from './intermediari.api';
import type { Intermediario } from './intermediario.model';

@Component({
  selector: 'lnk-intermediario-detail',
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
  templateUrl: './intermediario-detail.component.html',
})
export class IntermediarioDetailComponent implements OnInit {
  private readonly api = inject(IntermediariApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly intermediario = signal<Intermediario | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly abilitatoTone = computed(() => (this.intermediario()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.intermediario()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const i = this.intermediario();
    if (!i) return [];
    return [
      { labelKey: 'Intermediari.Detail.IdIntermediario', value: i.idIntermediario, mono: true, hide: !i.idIntermediario },
      { labelKey: 'Intermediari.Detail.Denominazione', value: i.denominazione, wide: true },
      { labelKey: 'Intermediari.Detail.PrincipalPagoPa', value: i.principalPagoPa, mono: true, hide: !i.principalPagoPa },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idIntermediario');
    if (!id) {
      this.router.navigate(['/registro-intermediari']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.RegistroIntermediari', url: '/registro-intermediari' },
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
      .subscribe((i) => {
        this.intermediario.set(i);
        this.loading.set(false);
      });
  }
}
