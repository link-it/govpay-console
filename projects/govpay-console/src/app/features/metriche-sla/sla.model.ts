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

// Modello delle metriche SLA (schema `SlaResponse` di openapi-20260908,
// endpoint `GET /metriche/sla`). Endpoint non ancora disponibile sul backend:
// oggi alimentato da un mock (vedi metriche-sla.service.ts).

/** Stato di conformità di un KPI (schema `SlaStato`). */
export type SlaStato = 'OK' | 'WARNING' | 'KO';

/** Codice dei 4 metodi PA pagoPA strumentati (schema `SlaKpiCodice`). */
export type SlaKpiCodice = 'TDP' | 'TGP' | 'TSRT' | 'TVP';

/** Intervallo del periodo di calcolo (schema `SlaPeriodo`, date ISO). */
export interface SlaPeriodo {
  da: string;
  a: string;
}

/** KPI di conformità per un metodo PA (schema `SlaKpi`). */
export interface SlaKpi {
  codice: SlaKpiCodice;
  /** Nome del metodo PA pagoPA (es. `paDemandPaymentNotice`). */
  metodo: string;
  /** Soglia di tempo di risposta in secondi. */
  sogliaSecondi: number;
  /** Percentile su cui è calcolata la conformità (es. 98). */
  sogliaPercentile: number;
  /** % di risposte entro `sogliaSecondi`; `null` se `totale=0`. */
  conformitaOsservata: number | null;
  /** Invocazioni totali osservate nel periodo. */
  totale: number;
  /** Invocazioni oltre soglia. */
  sopraSoglia: number;
  stato: SlaStato;
}

/** Risposta di `GET /metriche/sla` (schema `SlaResponse`). */
export interface SlaResponse {
  periodo: SlaPeriodo;
  kpi: SlaKpi[];
}
