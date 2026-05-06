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
 * Modelli Pendenza allineati al backend GovPay legacy
 * (`/govpay-api-backoffice/rs/form/v1/pendenze`).
 *
 * I tipi sono volutamente "minimal" per la lista; il dettaglio in fase
 * successiva amplierà con `voci`, `pagamenti`, `ricevute`.
 */

export type StatoPendenza =
  | 'NON_ESEGUITA'
  | 'ESEGUITA'
  | 'ESEGUITA_PARZIALE'
  | 'ANNULLATA'
  | 'SCADUTA'
  | 'INCASSATA'
  | 'ANOMALA';

export interface SoggettoPagatore {
  /** Tipo identificativo: `F` (codice fiscale persona fisica) o `G` (giuridica). */
  tipo?: 'F' | 'G';
  identificativo: string;
  anagrafica: string;
  email?: string;
  cellulare?: string;
}

export interface TipoPendenzaSummary {
  idTipoPendenza: string;
  descrizione: string;
}

export interface DominioSummary {
  idDominio: string;
  ragioneSociale: string;
}

export interface UnitaOperativaSummary {
  idUnita: string;
  ragioneSociale: string;
}

export interface Pendenza {
  /** Identificativo del gestionale (A2A) — chiave canonica per il detail. */
  idA2A?: string;
  /** Identificativo univoco della pendenza nel gestionale — chiave canonica per il detail. */
  idPendenza?: string;
  /** ID dominio flat — nella response BO non esiste, è dentro `dominio.idDominio`. Reso opzionale per compatibilità. */
  idDominio?: string;
  numeroAvviso?: string;
  iuv?: string;
  /** Alias del backend per il campo IUV emesso nell'avviso. */
  iuvAvviso?: string;
  iuvPagamento?: string;
  tipoPendenza: TipoPendenzaSummary;
  dominio?: DominioSummary;
  unitaOperativa?: UnitaOperativaSummary;
  stato: StatoPendenza;
  /** Stringa ISO 8601 (`'2026-04-30T10:00:00.000Z'`). */
  dataCaricamento: string;
  dataValidita?: string;
  dataScadenza?: string;
  /** Importo in euro (decimal). */
  importo: number;
  causale: string;
  soggettoPagatore: SoggettoPagatore;
  ricevute?: { iuv: string; idDominio: string }[];
}

/**
 * Mappa stato → chiave i18n. Le chiavi corrispondono a
 * `assets/i18n/{it,en}.json` → `Pendenze.Stati.*`.
 */
export const STATO_PENDENZA_LABEL: Record<StatoPendenza, string> = {
  NON_ESEGUITA: 'Pendenze.Stati.NonEseguita',
  ESEGUITA: 'Pendenze.Stati.Eseguita',
  ESEGUITA_PARZIALE: 'Pendenze.Stati.EseguitaParziale',
  ANNULLATA: 'Pendenze.Stati.Annullata',
  SCADUTA: 'Pendenze.Stati.Scaduta',
  INCASSATA: 'Pendenze.Stati.Incassata',
  ANOMALA: 'Pendenze.Stati.Anomala',
};

/**
 * Mappa stato → token CSS variable per il colore del badge.
 * Usato in `data-table` come classe per la cella.
 */
export const STATO_PENDENZA_COLOR: Record<StatoPendenza, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  ESEGUITA: 'success',
  INCASSATA: 'success',
  ESEGUITA_PARZIALE: 'info',
  NON_ESEGUITA: 'info',
  SCADUTA: 'warning',
  ANNULLATA: 'muted',
  ANOMALA: 'danger',
};

/* =========================================================================
 * Filtri di lista (passati come query params alla `GET /pendenze`).
 * ========================================================================= */

export interface PendenzeListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  stato?: StatoPendenza;
  idDominio?: string;
  idTipoPendenza?: string;
  iuv?: string;
  numeroAvviso?: string;
  identificativoSoggettoPagatore?: string;
  dataDa?: string;
  dataA?: string;
}
