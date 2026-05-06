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
 * Stati riscossione (OpenAPI `statoRiscossione`):
 *   - `RISCOSSA`: la riscossione è stata accreditata.
 *   - `INCASSATA`: la riscossione è stata anche riconciliata con l'incasso.
 */
export type StatoRiscossione = 'RISCOSSA' | 'INCASSATA';

/**
 * Tipologia della voce riscossa (OpenAPI `tipoRiscossione`).
 */
export type TipoRiscossione =
  | 'ENTRATA'
  | 'MBT'
  | 'ALTRO_INTERMEDIARIO'
  | 'ENTRATA_PA_NON_INTERMEDIATA';

/**
 * Voce di pendenza riscossa (presente solo nel detail).
 */
export interface VocePendenzaRiscossione {
  idVocePendenza?: string;
  importo?: number;
  descrizione?: string;
  /** Codice contabilizzazione (capitolo, SIOPE, ecc.). */
  codiceContabilita?: string;
  tipoContabilita?: string;
  ibanAccredito?: string;
}

/**
 * Risposta `riscossioneIndex` di `GET /riscossioni` (lista) o
 * `riscossione` di `GET /riscossioni/{idDominio}/{iuv}/{iur}/{indice}`
 * (detail). Il detail include in più `vocePendenza`.
 */
export interface Riscossione {
  idDominio: string;
  /** Identificativo univoco riscossione (IUR). */
  iur: string;
  /** IUV della pendenza riscossa. */
  iuv: string;
  /** Indice posizionale della voce pendenza riscossa. */
  indice: number;
  /** URL della pendenza oggetto della riscossione (es. `/pendenze/idA2A/abc`). */
  pendenza?: string;
  /** Identificativo della voce di pendenza nel gestionale proprietario (lista). */
  idVocePendenza?: string;
  /** Voce pendenza completa (detail). */
  vocePendenza?: VocePendenzaRiscossione;
  /** URL della richiesta di pagamento (RPP) che ha realizzato la riscossione. */
  rpp?: string;
  /** Riferimento all'operazione di incasso. */
  incasso?: string;
  stato: StatoRiscossione;
  tipo: TipoRiscossione;
  importo: number;
  /** ISO 8601 — data di esecuzione della riscossione. */
  data: string;
  commissioni?: number;
}

export const STATO_RISCOSSIONE_LABEL: Record<StatoRiscossione, string> = {
  RISCOSSA: 'Riscossioni.Stati.Riscossa',
  INCASSATA: 'Riscossioni.Stati.Incassata',
};

export const STATO_RISCOSSIONE_COLOR: Record<StatoRiscossione, 'success' | 'info'> = {
  RISCOSSA: 'info',
  INCASSATA: 'success',
};

export interface RiscossioniListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  stato?: StatoRiscossione;
  idDominio?: string;
  iuv?: string;
  iur?: string;
  dataDa?: string;
  dataA?: string;
}
