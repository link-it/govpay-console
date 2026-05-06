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
  formatDate,
  formatEuro,
  type InfoGridItem,
} from '@shared';
import { RiscossioniApi } from './riscossioni.api';
import {
  STATO_RISCOSSIONE_COLOR,
  STATO_RISCOSSIONE_LABEL,
  type Riscossione,
} from './riscossione.model';

@Component({
  selector: 'lnk-riscossione-detail',
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
  templateUrl: './riscossione-detail.component.html',
})
export class RiscossioneDetailComponent implements OnInit {
  private readonly api = inject(RiscossioniApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly riscossione = signal<Riscossione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statoTone = computed(() => {
    const s = this.riscossione()?.stato;
    return s ? STATO_RISCOSSIONE_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.riscossione()?.stato;
    return s ? STATO_RISCOSSIONE_LABEL[s] : 'Riscossioni.Stati.Riscossa';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.riscossione();
    if (!r) return [];
    return [
      { labelKey: 'Riscossioni.Detail.Iur', value: r.iur, mono: true },
      { labelKey: 'Riscossioni.Detail.Iuv', value: r.iuv, mono: true },
      { labelKey: 'Riscossioni.Detail.IdDominio', value: r.idDominio, mono: true },
      { labelKey: 'Riscossioni.Detail.Indice', value: String(r.indice) },
      { labelKey: 'Riscossioni.Detail.Tipo', value: r.tipo },
      { labelKey: 'Riscossioni.Detail.Data', value: formatDate(r.data) },
      { labelKey: 'Riscossioni.Detail.Importo', value: formatEuro(r.importo) },
      {
        labelKey: 'Riscossioni.Detail.Commissioni',
        value: r.commissioni != null ? formatEuro(r.commissioni) : undefined,
        hide: r.commissioni == null,
      },
    ];
  });

  readonly voceItems = computed<InfoGridItem[]>(() => {
    const v = this.riscossione()?.vocePendenza;
    if (!v) return [];
    return [
      { labelKey: 'Riscossioni.Detail.IdVocePendenza', value: v.idVocePendenza, mono: true, hide: !v.idVocePendenza },
      { labelKey: 'Riscossioni.Detail.Descrizione', value: v.descrizione, wide: true, hide: !v.descrizione },
      { labelKey: 'Riscossioni.Detail.ImportoVoce', value: v.importo != null ? formatEuro(v.importo) : undefined, hide: v.importo == null },
      { labelKey: 'Riscossioni.Detail.CodiceContabilita', value: v.codiceContabilita, mono: true, hide: !v.codiceContabilita },
      { labelKey: 'Riscossioni.Detail.TipoContabilita', value: v.tipoContabilita, hide: !v.tipoContabilita },
      { labelKey: 'Riscossioni.Detail.IbanAccredito', value: v.ibanAccredito, mono: true, hide: !v.ibanAccredito },
    ];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idDominio = params.get('idDominio');
    const iuv = params.get('iuv');
    const iur = params.get('iur');
    const indice = Number(params.get('indice'));
    if (!idDominio || !iuv || !iur || !indice) {
      this.router.navigate(['/riscossioni']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Riscossioni', url: '/riscossioni' },
      { label: iur },
    ]);
    this.fetch(idDominio, iuv, iur, indice);
  }

  private fetch(idDominio: string, iuv: string, iur: string, indice: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(idDominio, iuv, iur, indice)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((r) => {
        this.riscossione.set(r);
        this.loading.set(false);
      });
  }
}
