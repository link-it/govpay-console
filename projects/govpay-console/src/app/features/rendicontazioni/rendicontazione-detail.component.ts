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
import { RendicontazioniApi } from './rendicontazioni.api';
import {
  ESITO_VOCE_COLOR,
  ESITO_VOCE_LABEL,
  ESITO_VOCE_LABEL_FALLBACK,
  STATO_RENDICONTAZIONE_COLOR,
  STATO_RENDICONTAZIONE_LABEL,
  type RendicontazioneDetail,
  type RendicontazioneVoce,
} from './rendicontazione.model';
import type { StatusTone } from '@shared';

@Component({
  selector: 'lnk-rendicontazione-detail',
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
  templateUrl: './rendicontazione-detail.component.html',
})
export class RendicontazioneDetailComponent implements OnInit {
  private readonly api = inject(RendicontazioniApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly flusso = signal<RendicontazioneDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statoTone = computed(() => {
    const s = this.flusso()?.stato;
    return s ? STATO_RENDICONTAZIONE_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.flusso()?.stato;
    return s ? STATO_RENDICONTAZIONE_LABEL[s] : 'Rendicontazioni.Stati.Acquisito';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.flusso();
    if (!r) return [];
    return [
      { labelKey: 'Rendicontazioni.Detail.IdFlusso', value: r.idFlusso, mono: true, wide: true },
      { labelKey: 'Rendicontazioni.Detail.DataFlusso', value: formatDateTime(r.dataFlusso) },
      {
        labelKey: 'Rendicontazioni.Detail.DataRegolamento',
        value: r.dataRegolamento ? formatDate(r.dataRegolamento) : undefined,
        hide: !r.dataRegolamento,
      },
      {
        labelKey: 'Rendicontazioni.Detail.DataPubblicazione',
        value: r.dataOraPubblicazione ? formatDateTime(r.dataOraPubblicazione) : undefined,
        hide: !r.dataOraPubblicazione,
      },
      { labelKey: 'Rendicontazioni.Detail.Importo', value: formatEuro(r.importoTotale) },
      { labelKey: 'Rendicontazioni.Detail.NumeroPagamenti', value: String(r.numeroPagamenti) },
      { labelKey: 'Rendicontazioni.Detail.Trn', value: r.trn, mono: true, hide: !r.trn },
    ];
  });

  readonly enteItems = computed<InfoGridItem[]>(() => {
    const r = this.flusso();
    if (!r) return [];
    return [
      { labelKey: 'Rendicontazioni.Detail.IdDominio', value: r.idDominio, mono: true },
      { labelKey: 'Rendicontazioni.Detail.RagioneSocialeDominio', value: r.ragioneSocialeDominio, hide: !r.ragioneSocialeDominio },
    ];
  });

  readonly pspItems = computed<InfoGridItem[]>(() => {
    const r = this.flusso();
    if (!r) return [];
    return [
      { labelKey: 'Rendicontazioni.Detail.IdPsp', value: r.idPsp, mono: true },
      { labelKey: 'Rendicontazioni.Detail.RagioneSocialePsp', value: r.ragioneSocialePsp, hide: !r.ragioneSocialePsp },
    ];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idDominio = params.get('idDominio');
    const idFlusso = params.get('idFlusso');
    const dataFlusso = params.get('dataFlusso');
    if (!idDominio || !idFlusso || !dataFlusso) {
      this.router.navigate(['/rendicontazioni']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Rendicontazioni', url: '/rendicontazioni' },
      { label: idFlusso },
    ]);
    this.fetch(idDominio, idFlusso, dataFlusso);
  }

  private fetch(idDominio: string, idFlusso: string, dataFlusso: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(idDominio, idFlusso, dataFlusso)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((r) => {
        this.flusso.set(r);
        this.loading.set(false);
      });
  }

  formatVoceImporto(v: { importo: number }): string {
    return formatEuro(v.importo);
  }

  formatVoceData(v: { data: string }): string {
    return formatDate(v.data);
  }

  esitoVoceTone(v: RendicontazioneVoce): StatusTone {
    return ESITO_VOCE_COLOR[v.esito] ?? 'muted';
  }

  esitoVoceLabelKey(v: RendicontazioneVoce): string {
    return ESITO_VOCE_LABEL[v.esito] ?? ESITO_VOCE_LABEL_FALLBACK;
  }
}
