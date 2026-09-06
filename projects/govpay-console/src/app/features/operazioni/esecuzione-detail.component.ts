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
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, timer, switchMap, type Subscription } from 'rxjs';
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
  formatDateTime,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { OperazioniConsoleApi } from './operazioni.console-api';
import {
  STATO_ESECUZIONE_COLOR,
  STATO_ESECUZIONE_LABEL,
  isEsecuzioneAttiva,
  type Esecuzione,
} from './operazione.model';

/** Intervallo di polling mentre l'esecuzione è attiva (IN_CODA/IN_CORSO). */
const POLL_MS = 4000;

@Component({
  selector: 'lnk-esecuzione-detail',
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
  templateUrl: './esecuzione-detail.component.html',
})
export class EsecuzioneDetailComponent implements OnInit {
  private readonly api = inject(OperazioniConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private idOperazione = '';
  private idEsecuzione = '';
  private pollSub: Subscription | null = null;

  readonly backUrl = computed(() => `/operazioni/${encodeURIComponent(this.idOperazione)}`);
  readonly esecuzione = signal<Esecuzione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly annullando = signal(false);
  /** true mentre il polling è attivo (esecuzione non terminale). */
  readonly polling = signal(false);

  readonly attiva = computed(() => isEsecuzioneAttiva(this.esecuzione()?.stato));

  readonly statoTone = computed(() => {
    const s = this.esecuzione()?.stato;
    return s ? STATO_ESECUZIONE_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.esecuzione()?.stato;
    return s ? STATO_ESECUZIONE_LABEL[s] : 'Operazioni.Stati.InCoda';
  });

  readonly datiItems = computed<InfoGridItem[]>(() => {
    const e = this.esecuzione();
    if (!e) return [];
    return [
      { labelKey: 'Operazioni.Esecuzioni.Detail.Id', value: e.idEsecuzione, mono: true, wide: true },
      { labelKey: 'Operazioni.Esecuzioni.Detail.Percentuale', value: e.percentuale != null ? `${e.percentuale}%` : undefined, hide: e.percentuale == null },
      { labelKey: 'Operazioni.Esecuzioni.Detail.Inizio', value: formatDateTime(e.dataInizio) },
      { labelKey: 'Operazioni.Esecuzioni.Detail.Fine', value: e.dataFine ? formatDateTime(e.dataFine) : undefined, hide: !e.dataFine },
      { labelKey: 'Operazioni.Esecuzioni.Detail.Forzata', value: e.forzata == null ? undefined : this.translate.instant(e.forzata ? 'Common.Yes' : 'Common.No'), hide: e.forzata == null },
      { labelKey: 'Operazioni.Esecuzioni.Detail.Descrizione', value: e.descrizione ?? undefined, wide: true, hide: !e.descrizione },
    ];
  });

  readonly esito = computed(() => this.esecuzione()?.esito ?? null);

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idOperazione = params.get('idOperazione');
    const idEsecuzione = params.get('idEsecuzione');
    if (!idOperazione || !idEsecuzione) {
      this.router.navigate(['/operazioni']);
      return;
    }
    this.idOperazione = idOperazione;
    this.idEsecuzione = idEsecuzione;
    this.system.setBreadcrumbs([
      { label: 'Nav.Operazioni', url: '/operazioni' },
      { label: idOperazione, url: `/operazioni/${idOperazione}` },
      { label: idEsecuzione },
    ]);
    this.fetch(true);
  }

  /** Fetch singolo; se `startPolling` e lo stato è attivo, avvia il polling. */
  private fetch(startPolling: boolean): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getEsecuzione(this.idOperazione, this.idEsecuzione)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((e) => {
        this.esecuzione.set(e);
        this.loading.set(false);
        if (startPolling && e && isEsecuzioneAttiva(e.stato)) this.startPolling();
      });
  }

  /** Poll periodico finché l'esecuzione non raggiunge uno stato terminale. */
  private startPolling(): void {
    if (this.pollSub) return;
    this.polling.set(true);
    this.pollSub = timer(POLL_MS, POLL_MS)
      .pipe(
        switchMap(() => this.api.getEsecuzione(this.idOperazione, this.idEsecuzione).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        if (!e) return;
        this.esecuzione.set(e);
        if (!isEsecuzioneAttiva(e.stato)) this.stopPolling();
      });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.polling.set(false);
  }

  annulla(): void {
    if (this.annullando()) return;
    this.annullando.set(true);
    this.api
      .annulla(this.idOperazione, this.idEsecuzione)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Operazioni.Esecuzioni.Detail.AnnullaErrore')));
          return of<'error'>('error');
        })
      )
      .subscribe((res) => {
        this.annullando.set(false);
        if (res === 'error') return;
        this.snackbar.success(this.translate.instant('Operazioni.Esecuzioni.Detail.AnnullaSuccesso'));
        // Rileva il nuovo stato (ANNULLATA) e riavvia il polling se ancora attiva.
        this.fetch(true);
      });
  }
}
