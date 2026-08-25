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
 * Modelli **Operazioni asincrone — Console API V2** (`/operazioni`).
 *
 * Catalogo delle operazioni batch schedulabili/avviabili manualmente
 * (`GET /operazioni` → array, non paginato) e relative esecuzioni
 * (`/operazioni/{id}/esecuzioni`, paginazione offset + polling stato).
 */

/** Stato corrente di un'esecuzione (schema `StatoEsecuzione`). */
export type StatoEsecuzione = 'IN_CODA' | 'IN_CORSO' | 'COMPLETATA' | 'FALLITA' | 'ANNULLATA';

/** Stati non terminali: l'esecuzione è ancora in coda o in corso (→ polling). */
export const STATI_ESECUZIONE_ATTIVI: readonly StatoEsecuzione[] = ['IN_CODA', 'IN_CORSO'];

/** Esito di un'esecuzione terminata (schema `EsitoEsecuzione`). */
export interface EsitoEsecuzione {
  successo: boolean;
  messaggio?: string;
  errori?: string[];
}

/** Proiezione leggera di un'esecuzione (schema `EsecuzioneSummary`). */
export interface EsecuzioneSummary {
  idEsecuzione: string;
  stato: StatoEsecuzione;
  /** ISO 8601 — avvio (o creazione se ancora in coda). */
  dataInizio: string;
  /** ISO 8601 — fine; null se ancora in corso. */
  dataFine?: string | null;
}

/** Dettaglio canonico di un'esecuzione (schema `Esecuzione`). */
export interface Esecuzione {
  idEsecuzione: string;
  idOperazione: string;
  stato: StatoEsecuzione;
  /** Percentuale di completamento (0–100), se disponibile. */
  percentuale?: number | null;
  descrizione?: string | null;
  /** Dettaglio testuale multi-riga (log riassuntivo). */
  dettaglio?: string | null;
  dataInizio: string;
  dataFine?: string | null;
  /** Esito; null finché l'esecuzione non è terminata. */
  esito?: EsitoEsecuzione | null;
  /** true se avviata via POST, false se schedulata; null se non determinabile. */
  forzata?: boolean | null;
}

/** Voce di catalogo di un'operazione batch (schema `Operazione`). */
export interface Operazione {
  /** Codice identificativo (es. `RND`, `NTFY`). */
  id: string;
  nome: string;
  descrizione?: string | null;
  /** Intervallo tra esecuzioni schedulate, durata ISO 8601 (es. `PT2H`). */
  frequenzaSchedulata?: string | null;
  /** Ultima esecuzione; null se mai eseguita. */
  ultimaEsecuzione?: EsecuzioneSummary | null;
  /** ISO 8601 — prossima esecuzione schedulata; null se disabilitata/non schedulata. */
  prossimaEsecuzione?: string | null;
  /** true se in esecuzione ora; null se non determinabile. */
  lockAttivo?: boolean | null;
  abilitata: boolean;
}

/** Body di avvio manuale di un'operazione (schema `RichiestaEsecuzione`). */
export interface RichiestaEsecuzione {
  /** Forza l'avvio anche se è già in corso un'esecuzione della stessa operazione. */
  force?: boolean;
}

/** Filtri di lista `GET /operazioni/{id}/esecuzioni` (offset). */
export interface EsecuzioniListFilters {
  page?: number;
  limit?: number;
  total?: boolean;
  statoEsecuzione?: StatoEsecuzione;
  dataInizioMin?: string;
  dataInizioMax?: string;
}

export const STATO_ESECUZIONE_LABEL: Record<StatoEsecuzione, string> = {
  IN_CODA: 'Operazioni.Stati.InCoda',
  IN_CORSO: 'Operazioni.Stati.InCorso',
  COMPLETATA: 'Operazioni.Stati.Completata',
  FALLITA: 'Operazioni.Stati.Fallita',
  ANNULLATA: 'Operazioni.Stati.Annullata',
};

export const STATO_ESECUZIONE_COLOR: Record<StatoEsecuzione, 'success' | 'warning' | 'danger' | 'info' | 'muted'> = {
  IN_CODA: 'info',
  IN_CORSO: 'info',
  COMPLETATA: 'success',
  FALLITA: 'danger',
  ANNULLATA: 'muted',
};

/** `true` se lo stato è non terminale (esecuzione ancora attiva). */
export function isEsecuzioneAttiva(stato: StatoEsecuzione | undefined | null): boolean {
  return !!stato && STATI_ESECUZIONE_ATTIVI.includes(stato);
}
