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

/**
 * Livello semantico riusato dalle spec (es. soglie del gauge). Mappato ai toni
 * del tema, non a colori espliciti: il colore lo decide {@link ChartTheme}.
 */
export type ChartLevel = 'ok' | 'warn' | 'critical' | 'muted';

/**
 * Tema **neutro** dei grafici, derivato dai design token dell'app. Non contiene
 * nulla di ECharts: è un contratto nostro (vedi §4 del documento di contesto),
 * così che il costo di un eventuale cambio libreria resti nel solo mapper.
 */
export interface ChartTheme {
  /** Colore del testo principale (valori, etichette). */
  text: string;
  /** Colore del testo secondario/muted (assi, sottotitoli). */
  textMuted: string;
  /** Colore di assi, griglia e tracce di sfondo. */
  axis: string;
  /** Palette categoriale per le serie (barre, linee, torte). */
  palette: string[];
  /** Toni semantici, indicizzati per {@link ChartLevel}. */
  status: Record<ChartLevel, string>;
  /** Font family dei testi del grafico. */
  fontFamily: string;
}
