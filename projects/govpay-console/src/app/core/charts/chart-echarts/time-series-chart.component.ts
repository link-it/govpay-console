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

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import type { TimeSeriesSpec } from '../chart-model';
import { ChartThemeService } from './chart-theme';
import { provideCharts, type ChartRenderer } from './echarts.providers';
import { toTimeSeriesOption } from './time-series.mapper';

/**
 * Wrapper di rendering per un grafico a serie storiche (linee/aree). Espone
 * alle feature una API in termini di {@link TimeSeriesSpec}: mapping e tema
 * restano confinati qui. Default `canvas`, indicato per le serie dense (§5).
 */
@Component({
  selector: 'lnk-time-series-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  // Config ngx-echarts scoped al componente: echarts resta nel chunk lazy (§5).
  providers: [provideCharts()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      echarts
      class="w-full"
      [style.height.px]="height()"
      [options]="option()"
      [initOpts]="initOpts()"
      [autoResize]="true"
    ></div>
  `,
})
export class TimeSeriesChartComponent {
  private readonly themeSvc = inject(ChartThemeService);

  /** Spec di dominio della serie storica (prodotta dagli adapter di feature). */
  readonly spec = input.required<TimeSeriesSpec>();
  /** Altezza del grafico in px. */
  readonly height = input(280);
  /** Motore di rendering: `canvas` (default, denso/realtime) o `svg` (nitido, stampa). */
  readonly renderer = input<ChartRenderer>('canvas');

  protected readonly option = computed<EChartsOption>(() =>
    toTimeSeriesOption(this.spec(), this.themeSvc.theme()),
  );
  protected readonly initOpts = computed(() => ({ renderer: this.renderer() }));
}
