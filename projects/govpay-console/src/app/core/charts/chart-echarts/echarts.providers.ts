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

import type { Provider } from '@angular/core';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import { provideEchartsCore } from 'ngx-echarts';

// Import **selettivi** (§5 del documento di contesto): registriamo solo i moduli
// effettivamente usati. L'import completo di echarts pesa ~1 MB; così si sta sui
// ~250–400 KB. Aggiungere qui i nuovi tipi di grafico man mano che servono
// (es. LineChart, BarChart, PieChart, DataZoomComponent…).
//
// Entrambi i renderer sono registrati per permettere la scelta **per-grafico**
// (input `renderer` sui componenti): Canvas per le serie dense/realtime, SVG per
// nitidezza in stampa/PDF e grafici leggeri (gauge/KPI). Vedi CanvasRenderer vs
// SVGRenderer nel documento di contesto.
echarts.use([GaugeChart, TitleComponent, TooltipComponent, CanvasRenderer, SVGRenderer]);

/** Renderer selezionabile per singolo grafico. */
export type ChartRenderer = 'canvas' | 'svg';

/**
 * Provider ngx-echarts con l'istanza `echarts/core` e gli import selettivi.
 * Da registrare una sola volta in `app.config.ts`.
 */
export function provideCharts(): Provider {
  return provideEchartsCore({ echarts });
}
