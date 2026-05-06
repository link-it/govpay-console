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
 * Categorie evento (legacy `CATEGORIE_EVENTO`).
 */
export type CategoriaEvento = 'INTERFACCIA' | 'INTERNO' | 'UTENTE';

/**
 * Ruolo dell'evento nello scambio (legacy `RUOLI_EVENTO`).
 */
export type RuoloEvento = 'CLIENT' | 'SERVER';

/**
 * Esito di un evento (OpenAPI `esitoEvento`).
 * La severità si mappa in:
 *   - 0 → OK (success)
 *   - 2 → KO (warning)
 *   - 4 → FAIL (danger)
 */
export type EsitoEvento = 'OK' | 'KO' | 'FAIL';

export interface Evento {
  id?: number;
  /** ISO 8601 — data e ora dell'evento. */
  dataEvento: string;
  /** Categoria (interfaccia/interno/utente). */
  categoriaEvento?: CategoriaEvento;
  ruolo?: RuoloEvento;
  /** Tipo evento dipendente dalla categoria (es. `pagamento`, `pendenza`, `nodo:nodoInviaRPT`). */
  tipoEvento?: string;
  sottotipoEvento?: string;
  esito?: EsitoEvento;
  severita?: 0 | 2 | 4;
  durataEvento?: number;
  componente?: string;
  idDominio?: string;
  iuv?: string;
  ccp?: string;
  codApplicazione?: string;
  idA2A?: string;
  idPendenza?: string;
  idSessione?: string;
  parametri?: Record<string, unknown>;
}

export const ESITO_EVENTO_LABEL: Record<EsitoEvento, string> = {
  OK: 'GiornaleEventi.Esiti.Ok',
  KO: 'GiornaleEventi.Esiti.Ko',
  FAIL: 'GiornaleEventi.Esiti.Fail',
};

export const ESITO_EVENTO_COLOR: Record<EsitoEvento, 'success' | 'warning' | 'danger'> = {
  OK: 'success',
  KO: 'warning',
  FAIL: 'danger',
};

export const CATEGORIA_EVENTO_LABEL: Record<CategoriaEvento, string> = {
  INTERFACCIA: 'GiornaleEventi.Categorie.Interfaccia',
  INTERNO: 'GiornaleEventi.Categorie.Interno',
  UTENTE: 'GiornaleEventi.Categorie.Utente',
};

export interface GiornaleEventiListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  esito?: EsitoEvento;
  categoriaEvento?: CategoriaEvento;
  ruolo?: RuoloEvento;
  tipoEvento?: string;
  componente?: string;
  idDominio?: string;
  iuv?: string;
  codApplicazione?: string;
  idPendenza?: string;
  dataDa?: string;
  dataA?: string;
}

/**
 * Risposta `evento` (detail) di `GET /eventi/{id}`: estende `Evento`
 * con `parametriRichiesta` e `parametriRisposta` (oggetti opachi del
 * messaggio di interscambio).
 */
export interface EventoDetail extends Evento {
  parametriRichiesta?: Record<string, unknown>;
  parametriRisposta?: Record<string, unknown>;
}

/**
 * Mappa severità numerica (legacy) → esito normalizzato.
 */
export function severitaToEsito(severita?: number): EsitoEvento {
  if (severita == null || severita === 0) return 'OK';
  if (severita >= 4) return 'FAIL';
  return 'KO';
}
