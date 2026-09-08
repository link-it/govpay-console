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
 * Modelli **Giornale Eventi — Console API V2** (`/eventi`).
 *
 * La V2 è read-only e metadata-first: la lista espone `EventoSummary`
 * (nessun payload), il dettaglio `Evento` (summary + metadati dei payload +
 * HAL `_links`); i payload di richiesta/risposta sono su sub-resource dedicati
 * (`/eventi/{id}/richiesta`, `/eventi/{id}/risposta`) con audit GDPR distinto.
 */

/** Esito dell'evento (schema `EsitoEvento`). */
export type EsitoEvento = 'OK' | 'KO' | 'FAIL';

/** Categoria funzionale dell'evento (schema `CategoriaEvento`). */
export type CategoriaEvento = 'INTERNO' | 'INTERFACCIA' | 'UTENTE';

/** Ruolo di GovPay nello scambio (schema `RuoloEvento`). */
export type RuoloEvento = 'CLIENT' | 'SERVER';

/** Modulo interno che ha emesso l'evento (schema `ComponenteEvento`). */
export type ComponenteEvento =
  | 'API_BACKOFFICE'
  | 'API_ENTE'
  | 'API_PAGOPA'
  | 'API_PAGAMENTO'
  | 'API_PENDENZE'
  | 'API_RAGIONERIA'
  | 'API_BACKEND_IO'
  | 'API_SECIM'
  | 'API_MYPIVOT'
  | 'API_MAGGIOLI_JPPA'
  | 'API_GOVPAY'
  | 'API_HYPERSIC_APK'
  | 'API_USER'
  | 'GOVPAY'
  | 'API_LEGACY';

/** Hyperlink stile HAL (schema `Link`). */
export interface Link {
  href: string;
  type?: string;
}

/** Dati specifici pagoPA correlati all'evento (schema `DatiPagoPA`). */
export interface DatiPagoPA {
  idPsp?: string;
  idCanale?: string;
  idIntermediarioPsp?: string;
  tipoVersamento?: string;
  modelloPagamento?: string;
  idDominio?: string;
  idIntermediario?: string;
  idStazione?: string;
  idRiconciliazione?: string;
  sct?: string;
  idFlusso?: string;
  idTracciato?: number;
  identificativoErogatore?: string;
  identificativoFruitore?: string;
}

/**
 * Proiezione leggera (metadata-only) di un evento, usata nelle liste
 * (schema `EventoSummary`).
 */
export interface EventoSummary {
  id: number;
  /** ISO 8601 — quando l'evento è stato emesso. */
  dataEvento: string;
  /** Durata dell'operazione in ms (rinominato da V1 `durataEvento`). */
  durataEventoMs?: number;
  componente: ComponenteEvento;
  categoriaEvento: CategoriaEvento;
  ruolo: RuoloEvento;
  tipoEvento: string;
  sottotipoEvento?: string;
  esito: EsitoEvento;
  /** Codice esito (es. `"200"`, `"PAA_PAGAMENTO_SCONOSCIUTO"`). */
  sottotipoEsito?: string;
  /** Messaggio human-readable dell'esito. */
  dettaglioEsito?: string;
  /** 0=info … 5; popolata solo per esiti KO/FAIL. */
  severita?: number;
  idDominio?: string;
  iuv?: string;
  ccp?: string;
  idA2A?: string;
  idPendenza?: string;
  idPagamento?: string;
  transactionId?: string;
  clusterId?: string;
  datiPagoPA?: DatiPagoPA;
}

/** Collezione di `_links` del dettaglio evento (schema `EventoLinks`). */
export interface EventoLinks {
  self: Link;
  richiesta?: Link;
  risposta?: Link;
  dominio?: Link;
  pendenza?: Link;
  flusso?: Link;
  [rel: string]: Link | undefined;
}

/**
 * Dettaglio metadata-only di un evento (schema `Evento`): `EventoSummary` +
 * metadati dei payload (content-type, dimensione, numero header) + `_links`.
 * I payload stessi sono sui sub-resource `richiesta`/`risposta`.
 */
export interface Evento extends EventoSummary {
  contentTypeRichiesta?: string;
  contentTypeRisposta?: string;
  dimensioneRichiesta?: number;
  dimensioneRisposta?: number;
  numeroHeadersRichiesta?: number;
  numeroHeadersRisposta?: number;
  _links: EventoLinks;
}

/** Header HTTP registrato su richiesta/risposta (schema `EventoHeader`). */
export interface EventoHeader {
  nome: string;
  valore: string;
  /** true se il valore è mascherato (`***REDACTED***`). */
  redatto: boolean;
}

/** Payload+header della richiesta registrata (schema `EventoRichiesta`). */
export interface EventoRichiesta {
  headers: EventoHeader[];
  /** Corpo raw, interpretabile secondo `contentTypeRichiesta`. */
  payload?: string;
}

/** Payload+header della risposta registrata (schema `EventoRisposta`). */
export interface EventoRisposta {
  headers: EventoHeader[];
  /** Corpo raw, interpretabile secondo `contentTypeRisposta`. */
  payload?: string;
}

/**
 * Filtri di lista `/eventi` (tutti opzionali, in AND). Match esatto salvo
 * `messaggi` (full-text). Paginazione **cursor** (`limit` + `cursor`): niente
 * `page`/`sort`/`total` (ordinamento fisso `dataEvento DESC, id DESC`).
 */
export interface EventoListFilters {
  /** Pagina 1-based (modalità offset). Mutuamente esclusivo con `cursor`. */
  page?: number;
  limit?: number;
  cursor?: string;
  /** Se `true` include `totalResults`/`totalPages` (COUNT, solo finestra ≤ 24h). */
  total?: boolean;
  dataDa?: string;
  dataA?: string;
  idDominio?: string;
  iuv?: string;
  ccp?: string;
  idA2A?: string;
  idPendenza?: string;
  componente?: ComponenteEvento;
  categoriaEvento?: CategoriaEvento;
  esito?: EsitoEvento;
  ruolo?: RuoloEvento;
  tipoEvento?: string;
  sottotipoEvento?: string;
  severitaDa?: number;
  severitaA?: number;
  messaggi?: string;
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
