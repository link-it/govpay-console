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
 * Dominio (ente creditore) — modello aderente a `dominioIndex` (lista) e
 * `dominio` (detail) dell'OpenAPI GovPay BO. La forma del detail estende
 * l'index con eventuale `tipoTassonomia` aggiuntivo (qui non differenziamo).
 */
export interface Dominio {
  idDominio: string;
  ragioneSociale: string;
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
  gln?: string;
  cbill?: string;
  iuvPrefix?: string;
  stazione?: string;
  auxDigit?: string;
  segregationCode?: string;
  logo?: string;
  abilitato?: boolean;
  autStampaPosteItaliane?: string;
  area?: string;
  intermediato?: boolean;
  scaricaFr?: boolean;
  /** URL alle sub-resources (sub-collezioni). */
  unitaOperative?: string;
  contiAccredito?: string;
  entrate?: string;
  tipiPendenza?: string;
}

export interface DominiListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  idDominio?: string;
  ragioneSociale?: string;
  abilitato?: boolean;
  intermediato?: boolean;
  idStazione?: string;
}
