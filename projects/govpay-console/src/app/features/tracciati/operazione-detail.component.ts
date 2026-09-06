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
import { SystemFacade, SnackbarService } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  ScrollableRegionFocusableDirective,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { TracciatiConsoleApi } from './tracciati.console-api';
import {
  STATO_OPERAZIONE_COLOR,
  STATO_OPERAZIONE_LABEL,
  TIPO_OPERAZIONE_LABEL,
  type OperazionePendenza,
} from './tracciato.model';

@Component({
  selector: 'lnk-operazione-detail',
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
    ScrollableRegionFocusableDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operazione-detail.component.html',
})
export class OperazioneDetailComponent implements OnInit {
  private readonly api = inject(TracciatiConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private idTracciato = '';
  readonly backUrl = computed(() => `/tracciati/${encodeURIComponent(this.idTracciato)}`);
  readonly operazione = signal<OperazionePendenza | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statoTone = computed(() => {
    const s = this.operazione()?.stato;
    return s ? STATO_OPERAZIONE_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.operazione()?.stato;
    return s ? STATO_OPERAZIONE_LABEL[s] : 'Tracciati.Operazioni.Stati.Eseguito';
  });

  readonly datiItems = computed<InfoGridItem[]>(() => {
    const o = this.operazione();
    if (!o) return [];
    return [
      { labelKey: 'Tracciati.Operazioni.Detail.Numero', value: String(o.numero), mono: true },
      { labelKey: 'Tracciati.Operazioni.Detail.Tipo', value: this.translate.instant(TIPO_OPERAZIONE_LABEL[o.tipoOperazione] ?? o.tipoOperazione) },
      { labelKey: 'Tracciati.Operazioni.Detail.DescrizioneStato', value: o.descrizioneStato ?? undefined, wide: true, hide: !o.descrizioneStato },
      { labelKey: 'Tracciati.Operazioni.Detail.Pendenza', value: o.identificativoPendenza ?? undefined, mono: true, hide: !o.identificativoPendenza },
      { labelKey: 'Tracciati.Operazioni.Detail.Avviso', value: o.numeroAvviso ?? undefined, mono: true, hide: !o.numeroAvviso },
      { labelKey: 'Tracciati.Operazioni.Detail.Applicazione', value: o.applicazione ?? undefined, hide: !o.applicazione },
      { labelKey: 'Tracciati.Operazioni.Detail.EnteCreditore', value: o.enteCreditore?.ragioneSociale || o.enteCreditore?.idDominio, hide: !o.enteCreditore },
      { labelKey: 'Tracciati.Operazioni.Detail.SoggettoPagatore', value: o.soggettoPagatore?.anagrafica || o.soggettoPagatore?.identificativo, hide: !o.soggettoPagatore },
    ];
  });

  readonly richiestaJson = computed(() => this.pretty(this.operazione()?.richiesta));
  readonly rispostaJson = computed(() => this.pretty(this.operazione()?.risposta));

  private pretty(value: unknown): string {
    if (value == null) return '';
    return JSON.stringify(value, null, 2);
  }

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const id = params.get('id');
    const numero = params.get('numero');
    if (!id || !numero) {
      this.router.navigate(['/tracciati']);
      return;
    }
    this.idTracciato = id;
    this.system.setBreadcrumbs([
      { label: 'Nav.Tracciati', url: '/tracciati' },
      { label: id, url: `/tracciati/${id}` },
      { label: numero },
    ]);
    this.fetch(id, numero);
  }

  private fetch(id: string, numero: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getOperazione(id, numero)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((o) => {
        this.operazione.set(o);
        this.loading.set(false);
      });
  }
}
