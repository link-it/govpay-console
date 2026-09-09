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
import type { GaugeSpec } from '../chart-model';
import { ChartThemeService } from './chart-theme';
import { provideCharts, type ChartRenderer } from './echarts.providers';
import { toGaugeOption } from './gauge.mapper';

/**
 * Wrapper di rendering per un gauge. Espone alle feature una API in termini di
 * {@link GaugeSpec} (modello neutro): il mapping verso ECharts e il tema restano
 * confinati qui. Zoneless-friendly: input signal + `computed()` che costruisce
 * l'option (§5). Ridisegna al cambio di spec o di tema.
 */
@Component({
  selector: 'lnk-gauge-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  // Config ngx-echarts scoped al componente: echarts resta nel chunk lazy delle
  // feature che lo usano, fuori dall'initial bundle (§5). Il grafico è così
  // self-contained: nessuna feature deve ricordarsi di provvederlo.
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
export class GaugeChartComponent {
  private readonly themeSvc = inject(ChartThemeService);

  /** Spec di dominio del gauge (prodotta dagli adapter di feature). */
  readonly spec = input.required<GaugeSpec>();
  /** Altezza del grafico in px. */
  readonly height = input(200);
  /** Motore di rendering: `canvas` (default, denso/realtime) o `svg` (nitido, stampa). */
  readonly renderer = input<ChartRenderer>('canvas');

  protected readonly option = computed<EChartsOption>(() =>
    toGaugeOption(this.spec(), this.themeSvc.theme()),
  );
  protected readonly initOpts = computed(() => ({ renderer: this.renderer() }));
}
