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
 * Stato flusso rendicontazione (OpenAPI `statoFlussoRendicontazione`).
 * I valori sono Capitalized lato API (NON in maiuscolo).
 */
export type StatoRendicontazione = 'Acquisito' | 'Anomalo' | 'Rifiutato';

/**
 * Risposta `flussoRendicontazioneIndex` di `GET /flussiRendicontazione`.
 */
export interface Rendicontazione {
  /** Identificativo del flusso di rendicontazione. */
  idFlusso: string;
  /** ISO 8601 — data di emissione del flusso. */
  dataFlusso: string;
  /** ISO 8601 — data di pubblicazione (acquisizione lato GovPay). */
  dataOraPubblicazione?: string;
  /** Identificativo dell'operazione di riversamento assegnato dal PSP debitore. */
  trn?: string;
  /** ISO 8601 — data dell'operazione di riversamento fondi. */
  dataRegolamento?: string;
  importoTotale: number;
  numeroPagamenti: number;
  idDominio: string;
  ragioneSocialeDominio?: string;
  idPsp: string;
  ragioneSocialePsp?: string;
  stato?: StatoRendicontazione;
}

export const STATO_RENDICONTAZIONE_LABEL: Record<StatoRendicontazione, string> = {
  Acquisito: 'Rendicontazioni.Stati.Acquisito',
  Anomalo: 'Rendicontazioni.Stati.Anomalo',
  Rifiutato: 'Rendicontazioni.Stati.Rifiutato',
};

export const STATO_RENDICONTAZIONE_COLOR: Record<StatoRendicontazione, 'success' | 'warning' | 'danger'> = {
  Acquisito: 'success',
  Anomalo: 'warning',
  Rifiutato: 'danger',
};

/**
 * Singola occorrenza rendicontata (detail) — `rendicontazione` schema OpenAPI:
 * base con `iuv`/`iur`/`indice`/`importo`/`esito`/`data` + eventuale
 * `riscossione` collegata.
 *
 * Codici `esito` (legacy):
 *   - 0  = pagamento eseguito
 *   - 3  = pagamento revocato
 *   - 4  = pagamento eseguito tramite standin
 *   - 8  = pagamento eseguito tramite standin in assenza di RPT
 *   - 9  = pagamento riconciliato
 */
export interface RendicontazioneVoce {
  iuv: string;
  iur: string;
  indice: number;
  importo: number;
  esito: number;
  data: string;
}

/** Mappa `esito` numerico → chiave i18n. Codici dal legacy `util.service.ts`. */
export const ESITO_VOCE_LABEL: Record<number, string> = {
  0: 'Rendicontazioni.Esiti.Eseguito',
  3: 'Rendicontazioni.Esiti.Revocato',
  4: 'Rendicontazioni.Esiti.EseguitoStandin',
  8: 'Rendicontazioni.Esiti.EseguitoStandinNoRPT',
  9: 'Rendicontazioni.Esiti.Riconciliato',
};

/** Tone status badge per ciascun codice `esito`. */
export const ESITO_VOCE_COLOR: Record<number, 'success' | 'warning' | 'danger' | 'info' | 'muted'> = {
  0: 'success',
  3: 'warning',
  4: 'info',
  8: 'info',
  9: 'success',
};

/** Etichetta i18n di fallback per esiti sconosciuti. */
export const ESITO_VOCE_LABEL_FALLBACK = 'Common.Unknown';

export interface RendicontazioneSegnalazione {
  codice: string;
  descrizione: string;
}

/**
 * Risposta `flussoRendicontazione` di
 * `GET /flussiRendicontazione/{idFlusso}` (e variante con dataOraFlusso).
 *
 * Estende `Rendicontazione` (= flussoRendicontazioneIndex) con eventuali
 * `segnalazioni` e l'elenco delle `rendicontazioni` (singoli pagamenti).
 */
export interface RendicontazioneDetail extends Rendicontazione {
  segnalazioni?: RendicontazioneSegnalazione[];
  rendicontazioni?: RendicontazioneVoce[];
}

export interface RendicontazioniListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  stato?: StatoRendicontazione;
  idDominio?: string;
  idFlusso?: string;
  iuv?: string;
  dataDa?: string;
  dataA?: string;
}
