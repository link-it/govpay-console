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
 * Modelli **Consultazione pagoPA — Console API V2** (`/pagopa`).
 *
 * Cache locale di sincronizzazione pagoPA usata come **lookup** per il
 * censimento assistito: enti creditori (typeahead + anagrafica per
 * precompilare il form Dominio) e IBAN abilitati per un dominio. Nessuna
 * pagina/route dedicata: si consuma dentro i form di Domini/Impostazioni.
 */

/** Proiezione leggera dell'Ente Creditore (schema `EnteCreditoreSummary`). */
export interface EnteCreditoreSummary {
  /** Codice fiscale dell'ente creditore su pagoPA. */
  taxCode: string;
  /** Denominazione dell'ente creditore su pagoPA. */
  companyName: string;
}

/** Anagrafica dell'Ente Creditore (schema `EnteCreditore`). */
export interface EnteCreditore {
  taxCode: string;
  companyName: string;
  /** Identificativo della stazione associata su pagoPA. */
  stationId?: string;
  /** Cifra ausiliaria del numero avviso. */
  auxDigit?: string;
  /** Codice di segregazione. */
  segregationCode?: string;
  /** Codice CBILL. */
  cbill?: string;
  /** ISO 8601 — ultima sincronizzazione da pagoPA. */
  dataUltimoAggiornamento: string;
}

/** IBAN abilitato su pagoPA per un dominio (schema `IbanPagoPa`). */
export interface IbanPagoPa {
  iban: string;
  /** Stato ENABLED su pagoPA all'ultima sincronizzazione. */
  attivo: boolean;
  /** ISO 8601 — ultima verifica/sincronizzazione. */
  dataUltimaVerificaPagopa: string;
}

/** Filtri di lista `/pagopa/enti-creditori` (typeahead). */
export interface EntiCreditoriListFilters {
  page?: number;
  limit?: number;
  sort?: string;
  total?: boolean;
  /** Ricerca a match parziale su taxCode/companyName. */
  search?: string;
}
