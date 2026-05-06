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
 * Modelli Ricevuta = Richiesta di Pagamento Pendenza (RPP) — la lista vive
 * sull'endpoint `/rpp` del backend GovPay BO. La risposta non è "appiattita":
 * i campi visibili (IUV, importo, pagatore, dominio, …) si trovano nella
 * `pendenza` annidata, mentre stato/dettaglio sono al livello top.
 */

import type { DominioSummary, SoggettoPagatore } from '../pendenze/pendenza.model';

/**
 * Esito sintetico della RPT — usato come parametro di filtro `esito`
 * (OpenAPI `esitoRpt`, parametro query `esitoRpp`).
 *
 * NOTA: il valore `DECORENNZA_PARZIALE` con doppia "N" è quello accettato
 * dal backend (refuso storico nelle API). Mantenuto fedelmente.
 */
export type EsitoRicevuta =
  | 'IN_CORSO'
  | 'RIFIUTATO'
  | 'ESEGUITO'
  | 'NON_ESEGUITO'
  | 'ESEGUITO_PARZIALE'
  | 'DECORRENZA'
  | 'DECORENNZA_PARZIALE';

/**
 * Stato della RPP così come restituito dal backend (`item.stato`).
 */
export type StatoRpp =
  | 'RT_ACCETTATA_PA'
  | 'RT_RIFIUTATA_PA'
  | 'RT_ESITO_SCONOSCIUTO_PA'
  | 'RPT_ATTIVATA'
  | 'RPT_ACCETTATA_NODO'
  | 'RPT_ACCETTATA_PSP'
  | 'RPT_RIFIUTATA_NODO'
  | 'RPT_RIFIUTATA_PSP'
  | 'RPT_ERRORE_INVIO_A_PSP'
  | 'RPT_ANNULLATA'
  | 'RPT_SCADUTA';

/**
 * Pendenza embedded nella ricevuta. Schema realistico osservato sulla
 * response di `/rpp` (DEMO).
 */
export interface PendenzaInRicevuta {
  causale: string;
  soggettoPagatore: SoggettoPagatore;
  importo: number;
  numeroAvviso?: string;
  /** ISO 8601 — data di caricamento della pendenza nel sistema. */
  dataCaricamento?: string;
  dataValidita?: string;
  dataScadenza?: string;
  /** ISO 8601 — data del pagamento (se la RPP è stata pagata). */
  dataPagamento?: string;
  importoPagato?: number;
  importoIncassato?: number;
  iuvAvviso: string;
  iuvPagamento?: string;
  idA2A: string;
  idPendenza: string;
  tipoPendenza?: { idTipoPendenza: string; descrizione?: string };
  /** Dominio embedded — la response contiene molti più campi del nostro
   * `DominioSummary`, ma per il display servono solo `idDominio` e
   * `ragioneSociale`. Il resto è preservato come `Record` opzionale. */
  dominio: DominioSummary & Record<string, unknown>;
  stato?: string;
  anomalo?: boolean;
  verificato?: boolean;
  UUID?: string;
  /** Riferimenti URL alla RPP e ai pagamenti correlati. */
  rpp?: string;
  pagamenti?: string;
}

/**
 * RPT — porzione utile per il dettaglio (estratto dell'XML della richiesta).
 */
export interface RptDati {
  creditorReferenceId?: string;
  paymentAmount?: string;
  dueDate?: string;
  description?: string;
  companyName?: string;
}

/**
 * RT — porzione utile per il dettaglio (estratto dell'XML della ricevuta).
 */
export interface RtDati {
  receiptId?: string;
  noticeNumber?: string;
  fiscalCode?: string;
  outcome?: string;
  paymentAmount?: string;
  /** ISO 8601 — data e ora del pagamento dal nodo. */
  paymentDateTime?: string;
  applicationDate?: string;
  transferDate?: string;
  idPSP?: string;
  PSPCompanyName?: string;
  paymentMethod?: string;
  fee?: string;
}

/**
 * Singola ricevuta — risposta `rppIndex` di `GET /rpp`.
 */
export interface Ricevuta {
  stato: StatoRpp;
  dettaglioStato?: string;
  bloccante?: boolean;
  rpt?: RptDati;
  rt?: RtDati;
  pendenza: PendenzaInRicevuta;
  modello?: string;
}

export const STATO_RPP_LABEL: Record<StatoRpp, string> = {
  RT_ACCETTATA_PA: 'Ricevute.Stati.Eseguito',
  RT_RIFIUTATA_PA: 'Ricevute.Stati.RtRifiutata',
  RT_ESITO_SCONOSCIUTO_PA: 'Ricevute.Stati.Sconosciuto',
  RPT_ATTIVATA: 'Ricevute.Stati.InCorso',
  RPT_ACCETTATA_NODO: 'Ricevute.Stati.InCorso',
  RPT_ACCETTATA_PSP: 'Ricevute.Stati.InCorso',
  RPT_RIFIUTATA_NODO: 'Ricevute.Stati.Fallito',
  RPT_RIFIUTATA_PSP: 'Ricevute.Stati.Fallito',
  RPT_ERRORE_INVIO_A_PSP: 'Ricevute.Stati.Fallito',
  RPT_ANNULLATA: 'Ricevute.Stati.Annullato',
  RPT_SCADUTA: 'Ricevute.Stati.Scaduto',
};

export const STATO_RPP_COLOR: Record<StatoRpp, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  RT_ACCETTATA_PA: 'success',
  RT_RIFIUTATA_PA: 'danger',
  RT_ESITO_SCONOSCIUTO_PA: 'warning',
  RPT_ATTIVATA: 'info',
  RPT_ACCETTATA_NODO: 'info',
  RPT_ACCETTATA_PSP: 'info',
  RPT_RIFIUTATA_NODO: 'danger',
  RPT_RIFIUTATA_PSP: 'danger',
  RPT_ERRORE_INVIO_A_PSP: 'danger',
  RPT_ANNULLATA: 'muted',
  RPT_SCADUTA: 'warning',
};

export const ESITO_RICEVUTA_LABEL: Record<EsitoRicevuta, string> = {
  IN_CORSO: 'Ricevute.Esiti.InCorso',
  RIFIUTATO: 'Ricevute.Esiti.Rifiutato',
  ESEGUITO: 'Ricevute.Esiti.Eseguito',
  NON_ESEGUITO: 'Ricevute.Esiti.NonEseguito',
  ESEGUITO_PARZIALE: 'Ricevute.Esiti.EseguitoParziale',
  DECORRENZA: 'Ricevute.Esiti.Decorrenza',
  DECORENNZA_PARZIALE: 'Ricevute.Esiti.DecorrenzaParziale',
};

/**
 * Filtri supportati da `GET /rpp` (ricevute):
 *   - `idDominio`, `iuv`, `ccp`, `idA2A`, `idPendenza`, `idDebitore`
 *   - `esito` (param OpenAPI `esitoRpp` → schema `esitoRpt`)
 *   - `dataRptDa`/`dataRptA` (data della richiesta) e `dataRtDa`/`dataRtA` (data della ricevuta)
 *   - sort allowed: `dataRichiesta`, `stato`
 */
export interface RicevuteListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  esito?: EsitoRicevuta;
  idDominio?: string;
  iuv?: string;
  ccp?: string;
  idA2A?: string;
  idPendenza?: string;
  dataRptDa?: string;
  dataRptA?: string;
  dataRtDa?: string;
  dataRtA?: string;
}
