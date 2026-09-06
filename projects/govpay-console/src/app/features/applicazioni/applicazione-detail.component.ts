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
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  TabsComponent,
  type InfoGridItem,
  type TabDef,
} from '@linkit/shared-ui';
import { problemDetail, REF_ALL } from '@core/models';
import { AclEditorComponent } from '@core/ui/acl-editor/acl-editor.component';
import { SetPasswordCardComponent } from '@core/ui/set-password-card/set-password-card.component';
import { ApplicazioniConsoleApi } from './applicazioni.console-api';
import { ConnettoreIntegrazioneInlineComponent } from './connettore-integrazione-inline.component';
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
    TabsComponent,
    AclEditorComponent,
    ConnettoreIntegrazioneInlineComponent,
    SetPasswordCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applicazione-detail.component.html',
})
export class ApplicazioneDetailComponent implements OnInit {
  private readonly api = inject(ApplicazioniConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idA2A = '';

  readonly applicazione = signal<Applicazione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<'dati' | 'connettore'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati', labelKey: 'Applicazioni.Detail.TabDati' },
    { id: 'connettore', labelKey: 'Applicazioni.Detail.TabConnettore' },
  ]);

  readonly abilitatoTone = computed(() => (this.applicazione()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.applicazione()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const a = this.applicazione();
    if (!a) return [];
    const items: InfoGridItem[] = [
      { labelKey: 'Applicazioni.Detail.IdA2A', value: a.idA2A, mono: true },
      { labelKey: 'Applicazioni.Detail.Principal', value: a.principal, mono: true, wide: true },
    ];
    if (a.codificaAvvisi?.codificaIuv) {
      items.push({ labelKey: 'Applicazioni.Detail.CodificaIuv', value: a.codificaAvvisi.codificaIuv, mono: true });
    }
    return items;
  });

  readonly dominiList = computed<string[]>(() =>
    (this.applicazione()?.domini ?? []).map((d) =>
      d.idDominio === REF_ALL ? this.translate.instant('RefSelect.All') : d.ragioneSociale ? `${d.idDominio} — ${d.ragioneSociale}` : d.idDominio
    )
  );
  readonly tipiPendenzaList = computed<string[]>(() =>
    (this.applicazione()?.tipiPendenza ?? []).map((t) =>
      t.idTipoPendenza === REF_ALL ? this.translate.instant('RefSelect.All') : t.descrizione ? `${t.idTipoPendenza} — ${t.descrizione}` : t.idTipoPendenza
    )
  );
  readonly ruoliList = computed<string[]>(() => (this.applicazione()?.ruoli ?? []).map((r) => r.id));

  /** Riferimento stabile per `<lnk-set-password-card [submit]>`. */
  readonly setPassword = (nuovaPassword: string) => this.api.putPassword(this.idA2A, nuovaPassword);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idA2A');
    if (!id) {
      this.router.navigate(['/applicazioni']);
      return;
    }
    this.idA2A = id;
    this.system.setBreadcrumbs([{ label: 'Nav.Applicazioni', url: '/applicazioni' }, { label: id }]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idA2A)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
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
