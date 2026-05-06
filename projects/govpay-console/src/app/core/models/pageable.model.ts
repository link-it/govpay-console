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
 * Pagina standard delle API GovPay.
 */
export interface Pageable<T> {
  numPagine: number;
  numRisultati: number;
  pagina: number;
  prossimiRisultati?: string;
  risPerPagina: number;
  risultati: T[];
}

/**
 * Errore strutturato delle API GovPay.
 */
export interface ApiError {
  categoria: string;
  codice: string;
  descrizione: string;
  dettaglio?: string;
}

/**
 * Tipo logico delle entità manipolate dal backoffice.
 * Mappa di valori → segmento URL gestita in `ApiUrl`.
 */
export type TipoOggetto =
  | 'pendenze'
  | 'ricevute'
  | 'pagamenti'
  | 'registroIntermediari'
  | 'applicazioni'
  | 'domini'
  | 'tipiPendenze'
  | 'operatori'
  | 'giornaleEventi'
  | 'riscossioni'
  | 'rendicontazioni'
  | 'incassi'
  | 'ruoli'
  | 'tracciati';
