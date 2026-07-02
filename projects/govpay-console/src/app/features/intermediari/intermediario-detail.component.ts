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
  effect,
  inject,
  signal,
} from '@angular/core';
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
  StatusBadgeComponent,
  TabsComponent,
  type InfoGridItem,
  type TabDef,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { IntermediariConsoleApi } from './intermediari.console-api';
import { ConnettoreInlineComponent } from './connettore-inline.component';
import { StazioneInlineComponent } from './stazione-inline.component';
import { TIPI_CONNETTORE, type Intermediario, type StazioneSummary, type TipoConnettore } from './intermediario.model';

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
    TabsComponent,
    ListStickyToolbarDirective,
    ConnettoreInlineComponent,
    StazioneInlineComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intermediario-detail.component.html',
})
export class IntermediarioDetailComponent implements OnInit {
  private readonly api = inject(IntermediariConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idIntermediario = '';

  readonly intermediario = signal<Intermediario | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<'dati' | 'stazioni' | 'connettori'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati', labelKey: 'Intermediari.Detail.TabDati' },
    {
      id: 'stazioni',
      labelKey: 'Intermediari.Detail.TabStazioni',
      badge: this.stazioni() !== null ? this.stazioni()!.length : null,
      badgeLoading: this.stazioniLoading() && this.stazioni() === null,
    },
    { id: 'connettori', labelKey: 'Intermediari.Detail.TabConnettori' },
  ]);

  readonly tipiConnettore: TipoConnettore[] = TIPI_CONNETTORE;

  /* ---- Stazioni (lazy) + creazione inline ---- */
  readonly stazioni = signal<StazioneSummary[] | null>(null);
  readonly stazioniLoading = signal(false);
  readonly showCreateStazione = signal(false);

  /** Carica lazily le stazioni all'apertura del relativo tab. */
  private readonly _tabLoader = effect(() => {
    if (!this.intermediario()) return;
    if (this.activeTab() === 'stazioni' && this.stazioni() === null && !this.stazioniLoading()) {
      this.fetchStazioni();
    }
  });

  readonly abilitatoTone = computed(() => (this.intermediario()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() =>
    this.intermediario()?.abilitato ? 'Intermediari.Stato.Abilitato' : 'Intermediari.Stato.Disabilitato'
  );

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const i = this.intermediario();
    if (!i) return [];
    return [
      { labelKey: 'Intermediari.Detail.IdIntermediario', value: i.idIntermediario, mono: true },
      { labelKey: 'Intermediari.Detail.Denominazione', value: i.denominazione, wide: true },
      { labelKey: 'Intermediari.Detail.PrincipalPagoPa', value: i.principalPagoPa, mono: true, hide: !i.principalPagoPa },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idIntermediario');
    if (!id) {
      this.router.navigate(['/intermediari']);
      return;
    }
    this.idIntermediario = id;
    this.system.setBreadcrumbs([
      { label: 'Nav.Intermediari', url: '/intermediari' },
      { label: id },
    ]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idIntermediario)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
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

  private fetchStazioni(): void {
    this.stazioniLoading.set(true);
    this.api
      .listStazioni(this.idIntermediario, { limit: 200 })
      .pipe(catchError(() => of({ results: [] as StazioneSummary[] })))
      .subscribe((slice) => {
        this.stazioni.set(slice.results ?? []);
        this.stazioniLoading.set(false);
      });
  }

  /** Dopo create/update di una stazione: chiudi la creazione e ricarica la lista. */
  onStazioneSaved(): void {
    this.showCreateStazione.set(false);
    this.fetchStazioni();
  }
}
