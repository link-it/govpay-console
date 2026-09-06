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
import { catchError, of, type Observable } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@linkit/shared-ui';
import { SnackbarService } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  downloadBlob,
  formatDate,
  formatDateTime,
  formatEuro,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { RendicontazioniConsoleApi } from './rendicontazioni.console-api';
import {
  STATO_FLUSSO_COLOR,
  STATO_FLUSSO_LABEL,
  type FlussoRendicontazione,
} from './rendicontazione.model';

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
  private readonly api = inject(RendicontazioniConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private idDominio = '';
  private idFlusso = '';
  private idPsp = '';
  private revisione = '';

  readonly flusso = signal<FlussoRendicontazione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);

  readonly statoTone = computed(() => {
    const s = this.flusso()?.stato;
    return s ? STATO_FLUSSO_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.flusso()?.stato;
    return s ? STATO_FLUSSO_LABEL[s] : 'Rendicontazioni.Stati.Acquisito';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.flusso();
    if (!r) return [];
    return [
      { labelKey: 'Rendicontazioni.Detail.IdFlusso', value: r.idFlusso, mono: true, wide: true },
      { labelKey: 'Rendicontazioni.Detail.Revisione', value: String(r.revisione), mono: true },
      { labelKey: 'Rendicontazioni.Detail.DescrizioneStato', value: r.descrizioneStato, hide: !r.descrizioneStato },
      { labelKey: 'Rendicontazioni.Detail.DataFlusso', value: formatDateTime(r.dataOraFlusso) },
      { labelKey: 'Rendicontazioni.Detail.DataAcquisizione', value: formatDateTime(r.dataAcquisizione) },
      { labelKey: 'Rendicontazioni.Detail.DataRegolamento', value: r.dataRegolamento ? formatDate(r.dataRegolamento) : undefined, hide: !r.dataRegolamento },
      { labelKey: 'Rendicontazioni.Detail.SctBonifico', value: r.sctBonifico, mono: true, hide: !r.sctBonifico },
      { labelKey: 'Rendicontazioni.Detail.Importo', value: formatEuro(r.importoTotale) },
      { labelKey: 'Rendicontazioni.Detail.NumeroPagamenti', value: String(r.numeroPagamenti) },
      { labelKey: 'Rendicontazioni.Detail.DataInizio', value: r.dataInizio ? formatDateTime(r.dataInizio) : undefined, hide: !r.dataInizio },
      { labelKey: 'Rendicontazioni.Detail.DataFine', value: r.dataFine ? formatDateTime(r.dataFine) : undefined, hide: !r.dataFine },
    ];
  });

  readonly enteItems = computed<InfoGridItem[]>(() => {
    const r = this.flusso();
    if (!r) return [];
    return [{ labelKey: 'Rendicontazioni.Detail.IdDominio', value: r.idDominio, mono: true }];
  });

  readonly pspItems = computed<InfoGridItem[]>(() => {
    const r = this.flusso();
    if (!r) return [];
    return [{ labelKey: 'Rendicontazioni.Detail.IdPsp', value: r.idPsp, mono: true }];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idDominio = params.get('idDominio');
    const idFlusso = params.get('idFlusso');
    const idPsp = params.get('idPsp');
    const revisione = params.get('revisione');
    if (!idDominio || !idFlusso || !idPsp || !revisione) {
      this.router.navigate(['/rendicontazioni']);
      return;
    }
    this.idDominio = idDominio;
    this.idFlusso = idFlusso;
    this.idPsp = idPsp;
    this.revisione = revisione;
    this.system.setBreadcrumbs([
      { label: 'Nav.Rendicontazioni', url: '/rendicontazioni' },
      { label: idFlusso },
    ]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idDominio, this.idFlusso, this.idPsp, this.revisione)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
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

  onDownloadXml(): void {
    this.download(this.api.getXml(this.idDominio, this.idFlusso, this.idPsp, this.revisione));
  }

  private download(source: Observable<Blob>): void {
    if (this.downloading()) return;
    this.downloading.set(true);
    source
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Rendicontazioni.Detail.DownloadErrore')));
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.downloading.set(false);
        if (!blob) return;
        downloadBlob(blob, `flusso-${this.idFlusso}-rev${this.revisione}.xml`);
      });
  }
}
