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
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsoleApiService } from '@core/services/console-api.service';
import { SystemFacade, TweaksRegistry } from '@linkit/shared-ui';
import { SlaMetricheComponent } from '@feature/metriche-sla';
import { TransazioniAndamentoComponent } from '@feature/metriche-transazioni';
import type { Slice } from '@core/models';

interface KpiCard {
  titleKey: string;
  /** numero formattato; `null` finché loading. */
  value: number | null;
  loading: boolean;
  error: boolean;
  /** KPI non ancora esposto dalla console-api (Fase 1): card informativa, no fetch. */
  unavailable?: boolean;
  link: string[];
  queryParams?: Record<string, string>;
  hintKey: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

@Component({
  selector: 'lnk-dashboard',
  standalone: true,
  imports: [NgIcon, TranslatePipe, SlaMetricheComponent, TransazioniAndamentoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly system = inject(SystemFacade);
  private readonly api = inject(ConsoleApiService);
  private readonly router = inject(Router);

  /** Visibilità del grafico dimostrativo (mock), nascosto di default (sessione). */
  readonly showMock = signal(false);

  constructor() {
    // Toggle nel pannello tweaks per mostrare il grafico mock (transazioni).
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'dashboard',
        titleKey: 'Dashboard.Tweaks.Title',
        rows: [
          {
            type: 'toggle',
            labelKey: 'Dashboard.Tweaks.MockChart',
            hintKey: 'Dashboard.Tweaks.MockChartHint',
            value: this.showMock,
            onChange: (v) => this.showMock.set(v),
          },
        ],
        onReset: () => this.showMock.set(false),
      }),
    );
  }

  private readonly pendenzeAttive = signal<{ value: number | null; loading: boolean; error: boolean }>({ value: null, loading: true, error: false });
  private readonly tracciatiInLavorazione = signal<{ value: number | null; loading: boolean; error: boolean }>({ value: null, loading: true, error: false });

  readonly cards = computed<KpiCard[]>(() => {
    const p = this.pendenzeAttive();
    const t = this.tracciatiInLavorazione();
    return [
      {
        titleKey: 'Dashboard.Cards.PendenzeAttive',
        value: p.value,
        loading: p.loading,
        error: p.error,
        link: ['/pendenze'],
        hintKey: 'Dashboard.Cards.PendenzeAttiveHint',
        icon: 'bootstrapReceipt',
        tone: 'primary',
      },
      {
        titleKey: 'Dashboard.Cards.TracciatiInLavorazione',
        value: t.value,
        loading: t.loading,
        error: t.error,
        link: ['/tracciati'],
        hintKey: 'Dashboard.Cards.TracciatiInLavorazioneHint',
        icon: 'bootstrapFolder',
        tone: 'info',
      },
      {
        // Riscossioni: la console-api non espone ancora /riscossioni (Fase 1).
        titleKey: 'Dashboard.Cards.RiscossioniMese',
        value: null,
        loading: false,
        error: false,
        unavailable: true,
        link: ['/riscossioni'],
        hintKey: 'Dashboard.Cards.WaitingApi',
        icon: 'bootstrapBank',
        tone: 'success',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Dashboard' }]);
    this.loadKpi();
  }

  goTo(card: KpiCard): void {
    this.router.navigate(card.link, { queryParams: card.queryParams });
  }

  /**
   * KPI via console-api V2: conteggio con `limit=1&total=true` →
   * `pagination.totalResults`. Solo i KPI esposti in Fase 1 vengono richiesti
   * (le riscossioni non hanno ancora endpoint, vedi `cards`).
   */
  private loadKpi(): void {
    // Pendenze attive: stato V2 NON_PAGATA.
    this.api
      .list<unknown>('pendenze', { stato: 'NON_PAGATA', limit: 1, total: true })
      .pipe(catchError(() => of<Slice<unknown>>({ results: [] })))
      .subscribe((slice) => this.pendenzeAttive.set({ value: slice.pagination?.totalResults ?? 0, loading: false, error: !slice.pagination }));

    // Tracciati in elaborazione: filtro V2 `stato` (non `statoTracciatoPendenza`).
    this.api
      .list<unknown>('pendenze/tracciati', { stato: 'IN_ELABORAZIONE', limit: 1, total: true })
      .pipe(catchError(() => of<Slice<unknown>>({ results: [] })))
      .subscribe((slice) => this.tracciatiInLavorazione.set({ value: slice.pagination?.totalResults ?? 0, loading: false, error: !slice.pagination }));
  }
}
