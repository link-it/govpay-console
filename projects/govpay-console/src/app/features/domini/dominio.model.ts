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

/** Filtri lista domini + paginazione V2. */
export interface DominiListFilters extends PaginationParams {
  /** Match parziale sul codice dominio. */
  idDominio?: string;
  /** Match parziale sulla ragione sociale. */
  ragioneSociale?: string;
  /** Match esatto sullo stato di abilitazione. */
  abilitato?: boolean;
}
