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
 * Modelli **Flussi di rendicontazione — Console API V2**
 * (`/flussi-rendicontazione`).
 *
 * Consultazione read-only. La quaterna `idDominio`, `idFlusso`, `idPsp`,
 * `revisione` identifica univocamente un flusso. Il dettaglio è metadata-only
 * (niente `rendicontazioni`/voci inline come in V1): l'XML originale pagoPA si
 * ottiene sullo stesso path del dettaglio con `Accept: application/xml`.
 */

/** Hyperlink stile HAL (schema `Link`). */
export interface Link {
  href: string;
  type?: string;
}

/**
 * Stato del flusso (schema `StatoFlussoRendicontazione`). `OBSOLETO` prevale:
 * marca una revisione superata (il PSP ha riemesso con `revisione` maggiore).
 * NB: valori **MAIUSCOLI** (in V1 erano Capitalized).
 */
export type StatoFlussoRendicontazione = 'ACQUISITO' | 'ANOMALO' | 'RIFIUTATO' | 'OBSOLETO';

/**
 * Proiezione leggera (metadata-only) di un flusso, usata nelle liste
 * (schema `FlussoRendicontazioneSummary`).
 */
export interface FlussoRendicontazioneSummary {
  /** Codice fiscale dell'ente creditore (11 cifre). */
  idDominio: string;
  /** Identificativo del flusso assegnato dal PSP. */
  idFlusso: string;
  /** Identificativo del PSP mittente. */
  idPsp: string;
  /** Numero di revisione (i PSP possono ri-emettere lo stesso idFlusso). */
  revisione: number;
  /** ISO 8601 — data di emissione dichiarata dal PSP. */
  dataOraFlusso: string;
  /** ISO 8601 — data in cui GovPay ha scaricato il flusso da pagoPA. */
  dataAcquisizione: string;
  /** Data valuta del bonifico SCT di regolamento (`YYYY-MM-DD`). */
  dataRegolamento?: string;
  /** Riferimento del bonifico SEPA Credit Transfer di regolamento. */
  sctBonifico?: string;
  stato: StatoFlussoRendicontazione;
  /** Dettaglio human-readable dello stato. */
  descrizioneStato?: string;
  numeroPagamenti: number;
  importoTotale: number;
}

/** `_links` del dettaglio flusso (schema `FlussoRendicontazioneLinks`). */
export interface FlussoRendicontazioneLinks {
  dominio: Link;
  [rel: string]: Link | undefined;
}

/**
 * Dettaglio canonico del flusso (schema `FlussoRendicontazione`): summary +
 * finestra temporale coperta (`dataInizio`/`dataFine`, derivate da
 * MIN/MAX delle date dei pagamenti rendicontati) + `_links`.
 */
export interface FlussoRendicontazione extends FlussoRendicontazioneSummary {
  /** ISO 8601 — data del pagamento più vecchio rendicontato. */
  dataInizio?: string;
  /** ISO 8601 — data del pagamento più recente rendicontato. */
  dataFine?: string;
  _links: FlussoRendicontazioneLinks;
}

export const STATO_FLUSSO_LABEL: Record<StatoFlussoRendicontazione, string> = {
  ACQUISITO: 'Rendicontazioni.Stati.Acquisito',
  ANOMALO: 'Rendicontazioni.Stati.Anomalo',
  RIFIUTATO: 'Rendicontazioni.Stati.Rifiutato',
  OBSOLETO: 'Rendicontazioni.Stati.Obsoleto',
};

export const STATO_FLUSSO_COLOR: Record<StatoFlussoRendicontazione, 'success' | 'warning' | 'danger' | 'muted'> = {
  ACQUISITO: 'success',
  ANOMALO: 'warning',
  RIFIUTATO: 'danger',
  OBSOLETO: 'muted',
};

/**
 * Filtri di lista `/flussi-rendicontazione` (offset). `dataDa`/`dataA` sono
 * sulla **data di acquisizione** in ISO 8601 completo (RFC 3339).
 */
export interface FlussiRendicontazioneListFilters {
  page?: number;
  limit?: number;
  sort?: string;
  total?: boolean;
  cursor?: string;
  idDominio?: string;
  idFlusso?: string;
  idPsp?: string;
  stato?: StatoFlussoRendicontazione;
  incassato?: boolean;
  iuv?: string;
  dataDa?: string;
  dataA?: string;
}
