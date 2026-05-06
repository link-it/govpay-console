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
  PageHeaderComponent,
  StatusBadgeComponent,
} from '@shared';
import { RuoliApi } from './ruoli.api';
import type { Ruolo, RuoloAcl } from './ruolo.model';

@Component({
  selector: 'lnk-ruolo-detail',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruolo-detail.component.html',
})
export class RuoloDetailComponent implements OnInit {
  private readonly api = inject(RuoliApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly ruolo = signal<Ruolo | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idRuolo');
    if (!id) {
      this.router.navigate(['/ruoli']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Ruoli', url: '/ruoli' },
      { label: id },
    ]);
    this.fetch(id);
  }

  hasRead(a: RuoloAcl): boolean {
    return a.autorizzazioni?.includes('R');
  }

  hasWrite(a: RuoloAcl): boolean {
    return a.autorizzazioni?.includes('W');
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
      .subscribe((r) => {
        this.ruolo.set(r);
        this.loading.set(false);
      });
  }
}
