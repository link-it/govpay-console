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
  formatDateTime,
  formatEuro,
  type InfoGridItem,
} from '@shared';
import { IncassiApi } from './incassi.api';
import {
  STATO_INCASSO_COLOR,
  STATO_INCASSO_LABEL,
  type IncassoDetail,
} from './incasso.model';

@Component({
  selector: 'lnk-incasso-detail',
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
  templateUrl: './incasso-detail.component.html',
})
export class IncassoDetailComponent implements OnInit {
  private readonly api = inject(IncassiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly incasso = signal<IncassoDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statoTone = computed(() => {
    const s = this.incasso()?.stato;
    return s ? STATO_INCASSO_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.incasso()?.stato;
    return s ? STATO_INCASSO_LABEL[s] : 'Incassi.Stati.Acquisito';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const i = this.incasso();
    if (!i) return [];
    return [
      { labelKey: 'Incassi.Detail.IdIncasso', value: i.idIncasso, mono: true, wide: true },
      { labelKey: 'Incassi.Detail.Causale', value: i.causale, wide: true, hide: !i.causale },
      { labelKey: 'Incassi.Detail.Importo', value: formatEuro(i.importo) },
      { labelKey: 'Incassi.Detail.Data', value: i.data ? formatDateTime(i.data) : undefined, hide: !i.data },
      { labelKey: 'Incassi.Detail.DataValuta', value: i.dataValuta ? formatDate(i.dataValuta) : undefined, hide: !i.dataValuta },
      { labelKey: 'Incassi.Detail.DataContabile', value: i.dataContabile ? formatDate(i.dataContabile) : undefined, hide: !i.dataContabile },
      { labelKey: 'Incassi.Detail.IbanAccredito', value: i.ibanAccredito, mono: true, hide: !i.ibanAccredito },
      { labelKey: 'Incassi.Detail.Sct', value: i.sct, mono: true, hide: !i.sct },
      { labelKey: 'Incassi.Detail.Iuv', value: i.iuv, mono: true, hide: !i.iuv },
      { labelKey: 'Incassi.Detail.IdFlusso', value: i.idFlusso, mono: true, hide: !i.idFlusso },
      { labelKey: 'Incassi.Detail.DescrizioneStato', value: i.descrizioneStato, wide: true, hide: !i.descrizioneStato },
    ];
  });

  readonly enteItems = computed<InfoGridItem[]>(() => {
    const dom = this.incasso()?.dominio;
    if (!dom) return [];
    return [
      { labelKey: 'Incassi.Detail.IdDominio', value: dom.idDominio, mono: true },
      { labelKey: 'Incassi.Detail.RagioneSociale', value: dom.ragioneSociale, hide: !dom.ragioneSociale },
    ];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idDominio = params.get('idDominio');
    const idIncasso = params.get('idIncasso');
    if (!idDominio || !idIncasso) {
      this.router.navigate(['/incassi']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Incassi', url: '/incassi' },
      { label: idIncasso },
    ]);
    this.fetch(idDominio, idIncasso);
  }

  formatRiscossioneImporto(r: { importo: number }): string {
    return formatEuro(r.importo);
  }

  formatRiscossioneData(r: { data: string }): string {
    return formatDate(r.data);
  }

  private fetch(idDominio: string, idIncasso: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(idDominio, idIncasso)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((i) => {
        this.incasso.set(i);
        this.loading.set(false);
      });
  }
}
