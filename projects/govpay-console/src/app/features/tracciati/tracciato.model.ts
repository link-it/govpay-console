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

import type { DominioRef } from '@core/models';

/** Hyperlink stile HAL (schema `Link`). */
export interface Link {
  href: string;
  type?: string;
}

/** Stato di elaborazione del tracciato (schema `StatoTracciatoPendenza`). */
export type StatoTracciato =
  | 'IN_ATTESA'
  | 'IN_ELABORAZIONE'
  | 'ESEGUITO'
  | 'ESEGUITO_CON_ERRORI'
  | 'SCARTATO'
  | 'ELABORAZIONE_STAMPA';

/** Formato del file caricato (schema `FormatoTracciato`). */
export type FormatoTracciato = 'JSON' | 'CSV';

/** `_links` del tracciato: `self`/`richiesta`/`operazioni` sempre; `esito`/`stampe` condizionali. */
export interface TracciatoLinks {
  self?: Link;
  richiesta?: Link;
  esito?: Link;
  stampe?: Link;
  operazioni?: Link;
  [rel: string]: Link | undefined;
}

/**
 * Metadati di un tracciato di caricamento pendenze (schema `TracciatoPendenze`,
 * unico per lista e dettaglio). Non include il contenuto: il payload originale
 * è sulla sub-resource `/richiesta`.
 */
export interface Tracciato {
  id: number;
  nomeFile: string;
  dominio: DominioRef;
  idTipoPendenza?: string | null;
  /** ISO 8601 — data caricamento. */
  dataOraCaricamento: string;
  /** ISO 8601 — data ultimo aggiornamento elaborazione. */
  dataOraUltimoAggiornamento?: string | null;
  stato: StatoTracciato;
  descrizioneStato?: string | null;
  numeroOperazioniTotali?: number;
  numeroOperazioniEseguite?: number;
  numeroOperazioniFallite?: number;
  numeroAvvisiTotali?: number | null;
  numeroAvvisiStampati?: number | null;
  numeroAvvisiFalliti?: number | null;
  operatoreMittente?: string;
  stampaAvvisi?: boolean;
  formatoRichiesta: FormatoTracciato;
  _links?: TracciatoLinks;
}

/** Tipologia dell'operazione (riga) del tracciato (schema `TipoOperazionePendenza`). */
export type TipoOperazionePendenza = 'ADD' | 'DEL' | 'NON_VALIDA';

/** Esito di elaborazione di una riga (schema `StatoOperazionePendenza`). */
export type StatoOperazionePendenza = 'ESEGUITO' | 'SCARTATO' | 'NON_VALIDO';

/** Voce della lista operazioni del tracciato (schema `OperazionePendenzaSummary`). */
export interface OperazionePendenzaSummary {
  numero: number;
  tipoOperazione: TipoOperazionePendenza;
  stato: StatoOperazionePendenza;
  descrizioneStato?: string | null;
  identificativoPendenza?: string | null;
  numeroAvviso?: string | null;
  idDominio?: string | null;
  _links?: { self?: Link };
}

/** Categoria di un errore applicativo (schema `FaultBean`). */
export type FaultCategoria = 'AUTORIZZAZIONE' | 'RICHIESTA' | 'OPERAZIONE' | 'PAGOPA' | 'EC' | 'INTERNO';

/** Errore applicativo per un'operazione in esito negativo (schema `FaultBean`). */
export interface FaultBean {
  categoria: FaultCategoria;
  codice: string;
  descrizione: string;
  dettaglio?: string;
}

/** Soggetto pagatore (anagrafica, solo nel dettaglio operazione). */
export interface SoggettoPagatore {
  tipo?: string;
  identificativo?: string;
  anagrafica?: string;
  [k: string]: unknown;
}

/**
 * Dettaglio di una singola operazione del tracciato (schema `OperazionePendenza`):
 * summary + dati personali del soggetto pagatore + payload richiesta/risposta.
 */
export interface OperazionePendenza extends OperazionePendenzaSummary {
  enteCreditore?: DominioRef;
  soggettoPagatore?: SoggettoPagatore;
  applicazione?: string | null;
  /** Payload originale della riga, così come caricato. */
  richiesta?: unknown;
  /** Esito di elaborazione; null se non ancora elaborata. */
  risposta?: EsitoOperazionePendenza | null;
}

/** Esito di elaborazione di una singola riga (schema `EsitoOperazionePendenza`). */
export interface EsitoOperazionePendenza {
  idA2A: string;
  idPendenza: string;
  tipoOperazione: TipoOperazionePendenza;
  stato: StatoOperazionePendenza;
  esito: string;
  descrizioneEsito: string;
  numero: number;
  /** Avviso generato (positivo) o `FaultBean` (negativo). */
  dati?: unknown;
}

export const STATO_TRACCIATO_LABEL: Record<StatoTracciato, string> = {
  IN_ATTESA: 'Tracciati.Stati.InAttesa',
  IN_ELABORAZIONE: 'Tracciati.Stati.InElaborazione',
  ESEGUITO: 'Tracciati.Stati.Eseguito',
  ESEGUITO_CON_ERRORI: 'Tracciati.Stati.EseguitoConErrori',
  SCARTATO: 'Tracciati.Stati.Scartato',
  ELABORAZIONE_STAMPA: 'Tracciati.Stati.ElaborazioneStampa',
};

export const STATO_TRACCIATO_COLOR: Record<StatoTracciato, 'success' | 'warning' | 'danger' | 'info' | 'muted'> = {
  IN_ATTESA: 'info',
  IN_ELABORAZIONE: 'info',
  ESEGUITO: 'success',
  ESEGUITO_CON_ERRORI: 'warning',
  SCARTATO: 'danger',
  ELABORAZIONE_STAMPA: 'info',
};

export const STATO_OPERAZIONE_LABEL: Record<StatoOperazionePendenza, string> = {
  ESEGUITO: 'Tracciati.Operazioni.Stati.Eseguito',
  SCARTATO: 'Tracciati.Operazioni.Stati.Scartato',
  NON_VALIDO: 'Tracciati.Operazioni.Stati.NonValido',
};

export const STATO_OPERAZIONE_COLOR: Record<StatoOperazionePendenza, 'success' | 'warning' | 'danger'> = {
  ESEGUITO: 'success',
  SCARTATO: 'danger',
  NON_VALIDO: 'warning',
};

export const TIPO_OPERAZIONE_LABEL: Record<TipoOperazionePendenza, string> = {
  ADD: 'Tracciati.Operazioni.Tipi.Add',
  DEL: 'Tracciati.Operazioni.Tipi.Del',
  NON_VALIDA: 'Tracciati.Operazioni.Tipi.NonValida',
};

/** Filtri di lista `GET /pendenze/tracciati` (offset). Date in ISO 8601 completo. */
export interface TracciatiListFilters {
  page?: number;
  limit?: number;
  sort?: string;
  total?: boolean;
  cursor?: string;
  idDominio?: string;
  stato?: StatoTracciato;
  dataDa?: string;
  dataA?: string;
  operatoreMittente?: string;
  formatoRichiesta?: FormatoTracciato;
}
