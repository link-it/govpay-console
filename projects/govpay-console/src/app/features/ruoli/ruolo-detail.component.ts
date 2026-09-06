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
import { AclEditorComponent } from '@core/ui/acl-editor/acl-editor.component';
import { RuoliConsoleApi } from './ruoli.console-api';
import type { Ruolo } from './ruolo.model';

@Component({
  selector: 'lnk-ruolo-detail',
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
    AclEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruolo-detail.component.html',
})
export class RuoloDetailComponent implements OnInit {
  private readonly api = inject(RuoliConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idRuolo = '';

  readonly ruolo = signal<Ruolo | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.ruolo();
    if (!r) return [];
    return [{ labelKey: 'Ruoli.Detail.Id', value: r.idRuolo, mono: true, wide: true }];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idRuolo');
    if (!id) {
      this.router.navigate(['/ruoli']);
      return;
    }
    this.idRuolo = id;
    this.system.setBreadcrumbs([{ label: 'Nav.Ruoli', url: '/ruoli' }, { label: id }]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idRuolo)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
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
