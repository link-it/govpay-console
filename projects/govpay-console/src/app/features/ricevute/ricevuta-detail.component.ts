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
import { catchError, of, type Observable } from 'rxjs';
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
  downloadBlob,
  formatDateTime,
  formatEuro,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { RicevuteConsoleApi } from './ricevute.console-api';
import { statoRtColor, statoRtLabel, type Ricevuta, type RicevutaFormato } from './ricevuta.model';

@Component({
  selector: 'lnk-ricevuta-detail',
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
  templateUrl: './ricevuta-detail.component.html',
})
export class RicevutaDetailComponent implements OnInit {
  private readonly api = inject(RicevuteConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idDominio = '';
  iuv = '';
  idRicevuta = '';

  readonly ricevuta = signal<Ricevuta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Chiave del download in corso (es. `rt:pdf`), per disabilitare il bottone. */
  readonly downloading = signal<string | null>(null);

  readonly statoTone = computed(() => statoRtColor(this.ricevuta()?.stato ?? ''));
  readonly statoLabel = computed(() => statoRtLabel(this.ricevuta()?.stato ?? ''));
  /** La RPT può mancare (RT acquisita in standin): disabilita i relativi download. */
  readonly hasRpt = computed(() => this.ricevuta()?.rpt != null);
  readonly pendenza = computed(() => this.ricevuta()?.pendenza ?? null);

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.ricevuta();
    if (!r) return [];
    return [
      { labelKey: 'Ricevute.Detail.Iuv', value: r.iuv, mono: true },
      { labelKey: 'Ricevute.Detail.IdRicevuta', value: r.idRicevuta, mono: true },
      { labelKey: 'Ricevute.Detail.Dominio', value: r.idDominio, mono: true },
      { labelKey: 'Ricevute.Detail.DataPagamento', value: formatDateTime(r.dataPagamento) },
      { labelKey: 'Ricevute.Detail.Importo', value: r.importo != null ? formatEuro(r.importo) : undefined, hide: r.importo == null },
      { labelKey: 'Ricevute.Detail.Psp', value: r.codPsp, hide: !r.codPsp },
      { labelKey: 'Ricevute.Detail.Versione', value: r.versione, hide: !r.versione },
      { labelKey: 'Ricevute.Detail.DescrizioneStato', value: r.descrizioneStato, wide: true, hide: !r.descrizioneStato },
    ];
  });

  readonly pendenzaItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Ricevute.Detail.IdA2A', value: p.idA2A, mono: true },
      { labelKey: 'Ricevute.Detail.IdPendenza', value: p.idPendenza, mono: true },
      { labelKey: 'Ricevute.Detail.CausaleBreve', value: p.causaleBreve, wide: true, hide: !p.causaleBreve },
    ];
  });

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap;
    const idDominio = p.get('idDominio');
    const iuv = p.get('iuv');
    const idRicevuta = p.get('idRicevuta');
    if (!idDominio || !iuv || !idRicevuta) {
      this.router.navigate(['/ricevute']);
      return;
    }
    this.idDominio = idDominio;
    this.iuv = iuv;
    this.idRicevuta = idRicevuta;
    this.system.setBreadcrumbs([{ label: 'Nav.Ricevute', url: '/ricevute' }, { label: iuv }]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idDominio, this.iuv, this.idRicevuta)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((r) => {
        this.ricevuta.set(r);
        this.loading.set(false);
      });
  }

  onDownloadRt(formato: RicevutaFormato): void {
    this.download('rt', formato, this.api.getRtBlob(this.idDominio, this.iuv, this.idRicevuta, formato));
  }

  onDownloadRpt(formato: Exclude<RicevutaFormato, 'pdf'>): void {
    this.download('rpt', formato, this.api.getRptBlob(this.idDominio, this.iuv, this.idRicevuta, formato));
  }

  private download(risorsa: 'rt' | 'rpt', formato: RicevutaFormato, source: Observable<Blob>): void {
    if (this.downloading()) return;
    this.downloading.set(`${risorsa}:${formato}`);
    source
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Ricevute.Detail.DownloadErrore')));
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.downloading.set(null);
        if (!blob) return;
        downloadBlob(blob, `${risorsa}-${this.iuv}-${this.idRicevuta}.${formato}`);
      });
  }
}
