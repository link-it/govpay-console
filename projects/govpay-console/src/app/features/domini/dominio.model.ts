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
 * Modelli **Domini V2** (enti creditori) allineati alla GovPay Console API
 * (`/govpay-console-api/domini…`, tag Domini). Le sotto-risorse (unità
 * operative, conti accredito, entrate, tipi pendenza, connettori) e il logo
 * sono su endpoint dedicati.
 */

import type { IntermediarioRef, PaginationParams } from '@core/models';

/** Proiezione leggera per le liste (schema `DominioSummary`). */
export interface DominioSummary {
  idDominio: string;
  ragioneSociale: string;
  abilitato?: boolean;
}

/** Anagrafica comune (base di dominio/UO). */
interface AnagraficaBase {
  indirizzo?: string;
  civico?: string;
  cap?: string;
  localita?: string;
  provincia?: string;
  nazione?: string;
  email?: string;
  pec?: string;
  tel?: string;
  fax?: string;
  web?: string;
  area?: string;
}

/** Dettaglio canonico (schema `Dominio`). */
export interface Dominio extends AnagraficaBase {
  idDominio: string;
  ragioneSociale: string;
  gln?: string;
  cbill?: string;
  iuvPrefix?: string;
  autStampaPosteItaliane?: string;
  auxDigit?: number;
  segregationCode?: number;
  tassonomiaPagoPA?: string;
  intermediato?: boolean;
  scaricaFr?: boolean;
  abilitato?: boolean;
  idStazione?: string;
  /** Sola lettura: derivato dalla stazione. */
  riferimentoIntermediario?: IntermediarioRef;
}

/** Body per la creazione (schema `DominioCreate`). */
export interface DominioCreate extends AnagraficaBase {
  idDominio: string;
  ragioneSociale: string;
  abilitato: boolean;
  scaricaFr: boolean;
  gln?: string;
  cbill?: string;
  iuvPrefix?: string;
  autStampaPosteItaliane?: string;
  auxDigit?: number;
  segregationCode?: number;
  tassonomiaPagoPA?: string;
  intermediato?: boolean;
  idStazione?: string;
}

/** Body per il replace completo (schema `DominioReplace`, `idDominio` dal path). */
export type DominioReplace = Omit<DominioCreate, 'idDominio'>;

/* =========================================================================
 * Unità operative (sub-resource)
 * ========================================================================= */

/** Proiezione leggera (schema `UnitaOperativaSummary`). */
export interface UnitaOperativaSummary {
  idUnitaOperativa: string;
  ragioneSociale: string;
  abilitato?: boolean;
}

/** Dettaglio unità operativa (schema `UnitaOperativa`). */
export interface UnitaOperativa extends AnagraficaBase {
  idUnitaOperativa: string;
  ragioneSociale: string;
  abilitato: boolean;
}

/** Create (schema `UnitaOperativaCreate`). */
export interface UnitaOperativaCreate extends AnagraficaBase {
  idUnitaOperativa: string;
  ragioneSociale: string;
  abilitato: boolean;
}

/** Replace (schema `UnitaOperativaReplace`, id dal path). */
export type UnitaOperativaReplace = Omit<UnitaOperativaCreate, 'idUnitaOperativa'>;

/* =========================================================================
 * Conti di accredito (sub-resource)
 * ========================================================================= */

/** Proiezione leggera (schema `ContoAccreditoSummary`). */
export interface ContoAccreditoSummary {
  ibanAccredito: string;
  descrizione?: string;
  abilitato?: boolean;
}

/** Dettaglio conto accredito (schema `ContoAccredito`). */
export interface ContoAccredito {
  ibanAccredito: string;
  postale: boolean;
  abilitato: boolean;
  bic?: string;
  descrizione?: string;
  intestatario?: string;
  autStampaPosteItaliane?: string;
}

/** Create (schema `ContoAccreditoCreate`). */
export interface ContoAccreditoCreate {
  ibanAccredito: string;
  postale: boolean;
  abilitato: boolean;
  bic?: string;
  descrizione?: string;
  intestatario?: string;
  autStampaPosteItaliane?: string;
}

/** Replace (schema `ContoAccreditoReplace`, iban dal path). */
export type ContoAccreditoReplace = Omit<ContoAccreditoCreate, 'ibanAccredito'>;

/* =========================================================================
 * Entrate del dominio (sub-resource)
 * ========================================================================= */

/** Tipo di contabilità della voce (schema `TipoContabilita`). */
export type TipoContabilita =
  | 'CAPITOLO'
  | 'SPECIALE'
  | 'SIOPE'
  | 'SRTP_ESCLUSA_RAVV_OPEROSO'
  | 'SRTP_ESCLUSA_ALTRO_OPERATORE'
  | 'SRTP_ESCLUSA'
  | 'ALTRO';

export const TIPI_CONTABILITA: TipoContabilita[] = [
  'CAPITOLO',
  'SPECIALE',
  'SIOPE',
  'SRTP_ESCLUSA_RAVV_OPEROSO',
  'SRTP_ESCLUSA_ALTRO_OPERATORE',
  'SRTP_ESCLUSA',
  'ALTRO',
];

/** Proiezione leggera (schema `EntrataDominioSummary`). */
export interface EntrataDominioSummary {
  idEntrata: string;
  descrizione?: string;
  abilitato: boolean;
}

/** Configurazione contabile comune a dettaglio/create/replace. */
interface EntrataDominioConfig {
  ibanAccredito?: string;
  ibanAppoggio?: string;
  tipoContabilita?: TipoContabilita;
  codiceContabilita?: string;
}

/** Dettaglio entrata del dominio (schema `EntrataDominio`). */
export interface EntrataDominio extends EntrataDominioConfig {
  idEntrata: string;
  abilitato: boolean;
  /** Sola lettura: riferimento all'entrata globale associata. */
  tipoEntrata?: { idEntrata?: string; descrizione?: string; [k: string]: unknown };
}

/** Create (schema `EntrataDominioCreate`). */
export interface EntrataDominioCreate extends EntrataDominioConfig {
  idEntrata: string;
  abilitato: boolean;
}

/** Replace (schema `EntrataDominioReplace`, `idEntrata`/`tipoEntrata` dal path/read-only). */
export type EntrataDominioReplace = Omit<EntrataDominioCreate, 'idEntrata'>;

/* =========================================================================
 * Tipi pendenza del dominio (sub-resource)
 * ========================================================================= */

/** Proiezione leggera (schema `TipoPendenzaDominioSummary`). */
export interface TipoPendenzaDominioSummary {
  idTipoPendenza: string;
  descrizione?: string;
  abilitato?: boolean;
}

/**
 * Dettaglio tipo pendenza del dominio (schema `TipoPendenzaDominio`). Solo i
 * campi core sono modellati; le sotto-strutture ricche (portali, avvisature,
 * visualizzazione, tracciato) sono preservate as-is nel replace.
 */
export interface TipoPendenzaDominio {
  idTipoPendenza: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  /** Sola lettura: riferimento al tipo pendenza globale associato. */
  tipoPendenza?: { idTipoPendenza?: string; descrizione?: string; [k: string]: unknown };
  /** Sotto-strutture non modellate, da preservare nel replace. */
  [k: string]: unknown;
}

/** Create (schema `TipoPendenzaDominioCreate`). */
export interface TipoPendenzaDominioCreate {
  idTipoPendenza: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  [k: string]: unknown;
}

/** Replace (schema `TipoPendenzaDominioReplace`, `idTipoPendenza` dal path). */
export type TipoPendenzaDominioReplace = Omit<TipoPendenzaDominioCreate, 'idTipoPendenza'>;

/** Filtri lista domini + paginazione V2. */
export interface DominiListFilters extends PaginationParams {
  /** Match parziale sul codice dominio. */
  idDominio?: string;
  /** Match parziale sulla ragione sociale. */
  ragioneSociale?: string;
  /** Match esatto sullo stato di abilitazione. */
  abilitato?: boolean;
}
