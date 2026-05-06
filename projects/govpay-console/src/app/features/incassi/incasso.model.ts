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

import type { DominioSummary } from '../pendenze/pendenza.model';
import type { Riscossione } from '../riscossioni/riscossione.model';

/**
 * Stato incasso (OpenAPI `StatoIncasso`).
 */
export type StatoIncasso = 'IN_ELABORAZIONE' | 'ACQUISITO' | 'ERRORE';

/**
 * Risposta `incassoIndex` di `GET /incassi`.
 *
 * Per oneOf l'incasso è riferito a un IUV (riscossione) o a un idFlusso
 * (rendicontazione).
 */
export interface Incasso {
  dominio: DominioSummary;
  /** Identificativo dell'incasso. */
  idIncasso: string;
  causale: string;
  importo: number;
  /** ISO 8601 — data incasso. */
  data?: string;
  /** ISO 8601 — data di valuta dell'incasso. */
  dataValuta?: string;
  /** ISO 8601 — data contabile dell'incasso. */
  dataContabile?: string;
  /** Identificativo conto di tesoreria su cui sono stati incassati i fondi. */
  ibanAccredito?: string;
  /** Identificativo Sepa Credit Transfer. */
  sct?: string;
  stato: StatoIncasso;
  descrizioneStato?: string;
  /** Riferimento riscossione (mutualmente esclusivo con `idFlusso`). */
  iuv?: string;
  /** Riferimento flusso di rendicontazione (mutualmente esclusivo con `iuv`). */
  idFlusso?: string;
}

export const STATO_INCASSO_LABEL: Record<StatoIncasso, string> = {
  ACQUISITO: 'Incassi.Stati.Acquisito',
  IN_ELABORAZIONE: 'Incassi.Stati.InElaborazione',
  ERRORE: 'Incassi.Stati.Errore',
};

export const STATO_INCASSO_COLOR: Record<StatoIncasso, 'success' | 'warning' | 'danger'> = {
  ACQUISITO: 'success',
  IN_ELABORAZIONE: 'warning',
  ERRORE: 'danger',
};

/**
 * Risposta `incasso` (detail) di `GET /incassi/{idDominio}/{idIncasso}`:
 * estende `Incasso` con la lista delle `riscossioni` riconciliate.
 */
export interface IncassoDetail extends Incasso {
  riscossioni?: Riscossione[];
}

export interface IncassiListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  stato?: StatoIncasso;
  idDominio?: string;
  idFlusso?: string;
  iuv?: string;
  sct?: string;
  dataDa?: string;
  dataA?: string;
}
