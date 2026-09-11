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

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LoadingComponent } from '@linkit/shared-ui';
import { TimeSeriesChartComponent } from '@core/charts/chart-echarts';
import type { TimeSeriesSpec } from '@core/charts/chart-model';
import { MetricheTransazioniService } from './metriche-transazioni.service';
import { andamentoToTimeSeries } from './transazioni.adapter';

/**
 * Pannello pilota della **serie storica**: andamento giornaliero delle
 * transazioni pagoPA (pagate vs fallite). Consuma il service (mock), trasforma
 * il DTO in {@link TimeSeriesSpec} con l'adapter di feature e lo rende con
 * `lnk-time-series-chart` (renderer canvas, serie densa con zoom temporale).
 */
@Component({
  selector: 'lnk-transazioni-andamento',
  standalone: true,
  imports: [NgIcon, TranslatePipe, LoadingComponent, TimeSeriesChartComponent],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transazioni-andamento.component.html',
})
export class TransazioniAndamentoComponent implements OnInit {
  private readonly service = inject(MetricheTransazioniService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly periodo = signal<{ da: string; a: string } | null>(null);
  readonly spec = signal<TimeSeriesSpec | null>(null);

  ngOnInit(): void {
    this.load();
  }

  /** Ricarica l'andamento delle transazioni. */
  refresh(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service
      .getAndamento()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((a) => {
        this.periodo.set({ da: a.da, a: a.a });
        this.spec.set(
          andamentoToTimeSeries(a, {
            pagate: this.translate.instant('Transazioni.Pagate'),
            fallite: this.translate.instant('Transazioni.Fallite'),
          }),
        );
        this.loading.set(false);
      });
  }
}
