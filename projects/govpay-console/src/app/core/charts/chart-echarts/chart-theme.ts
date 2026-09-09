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

import { Injectable, computed, inject } from '@angular/core';
import { SystemFacade } from '@linkit/shared-ui';
import type { ChartTheme } from '../chart-model';

/**
 * Font e palette dei grafici derivati dai design token dell'app
 * (`styles.css`). ECharts non legge le CSS variables: il tema passa da oggetti
 * di configurazione (§5), quindi i valori sono replicati qui — un solo posto,
 * come richiede il documento di contesto.
 */
const FONT_FAMILY = "'Prompt', system-ui, -apple-system, sans-serif";

/** Tema chiaro: token della sezione `:root` di `styles.css`. */
export const LIGHT_CHART_THEME: ChartTheme = {
  text: '#213349', // --foreground
  textMuted: '#6a8da5', // --muted-foreground
  axis: '#cce3ed', // --border
  palette: ['#213349', '#ff4050', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2'],
  status: {
    ok: '#16a34a', // success
    warn: '#f59e0b', // warning
    critical: '#ef4444', // danger
    muted: '#6a8da5',
  },
  fontFamily: FONT_FAMILY,
};

/** Tema scuro: token della sezione `.dark` di `styles.css`, toni schiariti. */
export const DARK_CHART_THEME: ChartTheme = {
  text: '#e2e8f0', // --foreground (dark)
  textMuted: '#94a3b8', // --muted-foreground (dark)
  axis: '#1e293b', // --border (dark)
  palette: ['#cce3ed', '#ff6470', '#60a5fa', '#22c55e', '#fbbf24', '#a78bfa', '#22d3ee'],
  status: {
    ok: '#22c55e',
    warn: '#fbbf24',
    critical: '#f87171',
    muted: '#94a3b8',
  },
  fontFamily: FONT_FAMILY,
};

/**
 * Espone il {@link ChartTheme} attivo come signal, allineato allo schema colore
 * effettivo (`SystemFacade.resolvedScheme`, auto → light|dark). I componenti
 * grafici lo leggono in un `computed()` così ridisegnano al toggle del tema.
 */
@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly system = inject(SystemFacade);

  readonly theme = computed<ChartTheme>(() =>
    this.system.resolvedScheme() === 'dark' ? DARK_CHART_THEME : LIGHT_CHART_THEME,
  );
}
