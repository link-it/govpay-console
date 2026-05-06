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

import type { DominioSummary } from '../pendenze/pendenza.model';

/**
 * Stato tracciato pendenze (OpenAPI `statoTracciatoPendenza`).
 */
export type StatoTracciato =
  | 'IN_ATTESA'
  | 'IN_ELABORAZIONE'
  | 'ESEGUITO'
  | 'ESEGUITO_CON_ERRORI'
  | 'SCARTATO'
  | 'ELABORAZIONE_STAMPA';

/**
 * Risposta `tracciatoPendenzeIndex` di `GET /pendenze/tracciati`.
 */
export interface Tracciato {
  id: number;
  nomeFile: string;
  dominio?: DominioSummary;
  /** ISO 8601 — data caricamento. */
  dataOraCaricamento: string;
  /** ISO 8601 — data ultimo aggiornamento elaborazione. */
  dataOraUltimoAggiornamento?: string;
  stato: StatoTracciato;
  descrizioneStato?: string;
  numeroOperazioniTotali?: number;
  numeroOperazioniEseguite?: number;
  numeroOperazioniFallite?: number;
  numeroAvvisiTotali?: number;
  numeroAvvisiStampati?: number;
  numeroAvvisiFalliti?: number;
  /** Operatore del cruscotto che ha caricato il tracciato. */
  operatoreMittente?: string;
  stampaAvvisi?: boolean;
}

export const STATO_TRACCIATO_LABEL: Record<StatoTracciato, string> = {
  IN_ATTESA: 'Tracciati.Stati.InAttesa',
  IN_ELABORAZIONE: 'Tracciati.Stati.InElaborazione',
  ESEGUITO: 'Tracciati.Stati.Eseguito',
  ESEGUITO_CON_ERRORI: 'Tracciati.Stati.EseguitoConErrori',
  SCARTATO: 'Tracciati.Stati.Scartato',
  ELABORAZIONE_STAMPA: 'Tracciati.Stati.ElaborazioneStampa',
};

export const STATO_TRACCIATO_COLOR: Record<
  StatoTracciato,
  'success' | 'warning' | 'danger' | 'info' | 'muted'
> = {
  IN_ATTESA: 'info',
  IN_ELABORAZIONE: 'info',
  ESEGUITO: 'success',
  ESEGUITO_CON_ERRORI: 'warning',
  SCARTATO: 'danger',
  ELABORAZIONE_STAMPA: 'info',
};

/**
 * Filtri supportati da `GET /pendenze/tracciati`.
 *
 * NOTA: la GET non accetta `ordinamento`, `dataDa/A`, `nomeFile`, `tipo`.
 */
export interface TracciatiListFilters {
  pagina?: number;
  risPerPagina?: number;
  /** Filtro stato — il parametro lato API si chiama `statoTracciatoPendenza`. */
  statoTracciatoPendenza?: StatoTracciato;
  idDominio?: string;
}
