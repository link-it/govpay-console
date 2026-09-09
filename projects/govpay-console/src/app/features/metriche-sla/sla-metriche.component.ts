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
import { TranslatePipe } from '@ngx-translate/core';
import { LoadingComponent } from '@linkit/shared-ui';
import { GaugeChartComponent } from '@core/charts/chart-echarts';
import type { GaugeSpec } from '@core/charts/chart-model';
import { MetricheSlaService } from './metriche-sla.service';
import { slaKpiToGauge } from './sla.adapter';
import type { SlaPeriodo, SlaStato } from './sla.model';

/** Tono cromatico del badge di stato per ciascuno stato SLA. */
const STATO_TONE: Record<SlaStato, 'success' | 'warning' | 'danger'> = {
  OK: 'success',
  WARNING: 'warning',
  KO: 'danger',
};

/** Riga pronta al render: KPI + gauge spec + presentazione dello stato. */
interface SlaGaugeItem {
  codice: string;
  metodo: string;
  tone: 'success' | 'warning' | 'danger';
  statoKey: string;
  totale: number;
  spec: GaugeSpec;
}

/**
 * Pannello pilota dei grafici: i 4 gauge di conformità SLA (metodi PA pagoPA).
 * Consuma {@link MetricheSlaService} (oggi mock), trasforma i KPI in
 * {@link GaugeSpec} con l'adapter di feature e li rende con `lnk-gauge-chart`.
 */
@Component({
  selector: 'lnk-sla-metriche',
  standalone: true,
  imports: [TranslatePipe, LoadingComponent, GaugeChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sla-metriche.component.html',
})
export class SlaMetricheComponent implements OnInit {
  private readonly service = inject(MetricheSlaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly periodo = signal<SlaPeriodo | null>(null);
  readonly items = signal<SlaGaugeItem[]>([]);

  ngOnInit(): void {
    this.service
      .getSla()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.periodo.set(res.periodo);
        this.items.set(
          res.kpi.map((k) => ({
            codice: k.codice,
            metodo: k.metodo,
            tone: STATO_TONE[k.stato],
            statoKey: `Sla.Stato.${k.stato}`,
            totale: k.totale,
            spec: slaKpiToGauge(k),
          })),
        );
        this.loading.set(false);
      });
  }
}
