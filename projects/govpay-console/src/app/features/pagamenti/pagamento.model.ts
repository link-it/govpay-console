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

import type { SoggettoPagatore } from '../pendenze/pendenza.model';

/**
 * Stati Pagamento (RPP) del backend GovPay legacy
 * (vedi `STATI_PAGAMENTO` di `util.service.ts`).
 */
export type StatoPagamento =
  | 'IN_CORSO'
  | 'ESEGUITO'
  | 'ESEGUITO_PARZIALE'
  | 'NON_ESEGUITO'
  | 'ANNULLATO'
  | 'FALLITO'
  | 'DECORRENZA'
  | 'DECORRENZA_PARZIALE';

export interface PagamentoPendenzaRef {
  idDominio: string;
  numeroAvviso?: string;
  iuv?: string;
  importo?: number;
  causale?: string;
}

export interface PagamentoRicevutaRef {
  idDominio: string;
  iuv: string;
  ccp?: string;
}

export interface Pagamento {
  /** Identificativo del pagamento sul portale (UUID dal backend). */
  id: string;
  stato: StatoPagamento;
  /** ISO 8601 — data della richiesta di pagamento. */
  dataRichiestaPagamento: string;
  importo: number;
  /** Importo effettivamente pagato (valorizzato a fine flusso). */
  importoPagato?: number;
  soggettoVersante?: SoggettoPagatore;
  soggettoPagatore?: SoggettoPagatore;
  /** Identificativo del nodo (es. WISP, MAGGIOLI, ...). */
  nodo?: string;
  /** Numero di pendenze nel carrello del pagamento. */
  numeroPendenze?: number;
  /** Pendenze pagate / in pagamento (drilldown). */
  pendenze?: PagamentoPendenzaRef[];
  /** Ricevute generate dai nodi a fronte del pagamento. */
  ricevute?: PagamentoRicevutaRef[];
}

export const STATO_PAGAMENTO_LABEL: Record<StatoPagamento, string> = {
  IN_CORSO: 'Pagamenti.Stati.InCorso',
  ESEGUITO: 'Pagamenti.Stati.Eseguito',
  ESEGUITO_PARZIALE: 'Pagamenti.Stati.EseguitoParziale',
  NON_ESEGUITO: 'Pagamenti.Stati.NonEseguito',
  ANNULLATO: 'Pagamenti.Stati.Annullato',
  FALLITO: 'Pagamenti.Stati.Fallito',
  DECORRENZA: 'Pagamenti.Stati.Decorrenza',
  DECORRENZA_PARZIALE: 'Pagamenti.Stati.DecorrenzaParziale',
};

export const STATO_PAGAMENTO_COLOR: Record<StatoPagamento, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  ESEGUITO: 'success',
  ESEGUITO_PARZIALE: 'info',
  IN_CORSO: 'info',
  NON_ESEGUITO: 'warning',
  DECORRENZA: 'warning',
  DECORRENZA_PARZIALE: 'warning',
  ANNULLATO: 'muted',
  FALLITO: 'danger',
};

export interface PagamentiListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  stato?: StatoPagamento;
  identificativoSoggettoVersante?: string;
  dataDa?: string;
  dataA?: string;
}
