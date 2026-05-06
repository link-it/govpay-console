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
  formatDateTime,
  type InfoGridItem,
} from '@shared';
import { TracciatiApi } from './tracciati.api';
import {
  STATO_TRACCIATO_COLOR,
  STATO_TRACCIATO_LABEL,
  type Tracciato,
} from './tracciato.model';

@Component({
  selector: 'lnk-tracciato-detail',
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
  templateUrl: './tracciato-detail.component.html',
})
export class TracciatoDetailComponent implements OnInit {
  private readonly api = inject(TracciatiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly tracciato = signal<Tracciato | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statoTone = computed(() => {
    const s = this.tracciato()?.stato;
    return s ? STATO_TRACCIATO_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.tracciato()?.stato;
    return s ? STATO_TRACCIATO_LABEL[s] : 'Tracciati.Stati.InAttesa';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const t = this.tracciato();
    if (!t) return [];
    return [
      { labelKey: 'Tracciati.Detail.NomeFile', value: t.nomeFile, mono: true, wide: true },
      { labelKey: 'Tracciati.Detail.DataCaricamento', value: formatDateTime(t.dataOraCaricamento) },
      {
        labelKey: 'Tracciati.Detail.DataAggiornamento',
        value: t.dataOraUltimoAggiornamento ? formatDateTime(t.dataOraUltimoAggiornamento) : undefined,
        hide: !t.dataOraUltimoAggiornamento,
      },
      { labelKey: 'Tracciati.Detail.Operatore', value: t.operatoreMittente, hide: !t.operatoreMittente },
      { labelKey: 'Tracciati.Detail.DescrizioneStato', value: t.descrizioneStato, wide: true, hide: !t.descrizioneStato },
    ];
  });

  readonly enteItems = computed<InfoGridItem[]>(() => {
    const dom = this.tracciato()?.dominio;
    if (!dom) return [];
    return [
      { labelKey: 'Tracciati.Detail.IdDominio', value: dom.idDominio, mono: true },
      { labelKey: 'Tracciati.Detail.RagioneSociale', value: dom.ragioneSociale, hide: !dom.ragioneSociale },
    ];
  });

  readonly contatoriItems = computed<InfoGridItem[]>(() => {
    const t = this.tracciato();
    if (!t) return [];
    const num = (n?: number): string => (n != null ? String(n) : '0');
    return [
      { labelKey: 'Tracciati.Detail.OperazioniTotali', value: num(t.numeroOperazioniTotali) },
      { labelKey: 'Tracciati.Detail.OperazioniEseguite', value: num(t.numeroOperazioniEseguite) },
      { labelKey: 'Tracciati.Detail.OperazioniFallite', value: num(t.numeroOperazioniFallite) },
      { labelKey: 'Tracciati.Detail.AvvisiTotali', value: num(t.numeroAvvisiTotali), hide: t.numeroAvvisiTotali == null },
      { labelKey: 'Tracciati.Detail.AvvisiStampati', value: num(t.numeroAvvisiStampati), hide: t.numeroAvvisiStampati == null },
      { labelKey: 'Tracciati.Detail.AvvisiFalliti', value: num(t.numeroAvvisiFalliti), hide: t.numeroAvvisiFalliti == null },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tracciati']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Tracciati', url: '/tracciati' },
      { label: id },
    ]);
    this.fetch(id);
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
      .subscribe((t) => {
        this.tracciato.set(t);
        this.loading.set(false);
      });
  }
}
