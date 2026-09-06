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
 * Modelli **Entrate V2** (tipologie di entrata globali) allineati alla GovPay
 * Console API (`/govpay-console-api/entrate…`, tag Entrate).
 */

import type { PaginationParams } from '@core/models';

/**
 * Tipo di contabilità della voce (schema `TipoContabilita`, codifica DB V1 a 1
 * char: CAPITOLO=0, SPECIALE=1, SIOPE=2, SRTP_ESCLUSA_RAVV_OPEROSO=6,
 * SRTP_ESCLUSA_ALTRO_OPERATORE=7, SRTP_ESCLUSA=8, ALTRO=9).
 */
export type TipoContabilita =
  | 'CAPITOLO'
  | 'SPECIALE'
  | 'SIOPE'
  | 'SRTP_ESCLUSA_RAVV_OPEROSO'
  | 'SRTP_ESCLUSA_ALTRO_OPERATORE'
  | 'SRTP_ESCLUSA'
  | 'ALTRO';

/** Valori di `TipoContabilita` (per i select). */
export const TIPI_CONTABILITA: TipoContabilita[] = [
  'CAPITOLO',
  'SPECIALE',
  'SIOPE',
  'SRTP_ESCLUSA_RAVV_OPEROSO',
  'SRTP_ESCLUSA_ALTRO_OPERATORE',
  'SRTP_ESCLUSA',
  'ALTRO',
];

/** Proiezione leggera per le liste (schema `EntrataSummary`). */
export interface EntrataSummary {
  idEntrata: string;
  descrizione?: string;
}

/** Dettaglio canonico (schema `Entrata`). */
export interface Entrata {
  idEntrata: string;
  descrizione: string;
  tipoContabilita: TipoContabilita;
  codiceContabilita: string;
}

/** Body per la creazione (schema `EntrataCreate`). */
export interface EntrataCreate {
  idEntrata: string;
  descrizione: string;
  tipoContabilita: TipoContabilita;
  codiceContabilita: string;
}

/** Body per il replace completo (schema `EntrataReplace`, `idEntrata` dal path). */
export interface EntrataReplace {
  descrizione: string;
  tipoContabilita: TipoContabilita;
  codiceContabilita: string;
}

/** Filtri lista entrate + paginazione V2. */
export interface EntrateListFilters extends PaginationParams {
  /** Match parziale sul codice entrata. */
  idEntrata?: string;
  /** Match parziale sulla descrizione. */
  descrizione?: string;
}
