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
 * Modelli **TipiPendenza V2** (tipologie di pendenza globali) allineati alla
 * GovPay Console API (`/govpay-console-api/tipiPendenza…`, tag TipiPendenza).
 *
 * I sotto-oggetti config (`portaleBackoffice`, `portalePagamento`,
 * `avvisatura*`, `visualizzazione`, `tracciatoCsv`) sono opachi: tipizzati come
 * `Record<string, unknown>`. Il form ne modifica solo i campi core e
 * **preserva** i sotto-oggetti nel replace (PUT) per non azzerarli.
 */

import type { PaginationParams } from '@core/models';

/** Blocco di configurazione opaco (JSON libero, es. `visualizzazione`). */
export type TipoPendenzaConfig = Record<string, unknown>;

/** Definizione form di caricamento (portale backoffice/pagamento). */
export interface TipoPendenzaFormDef {
  /** Linguaggio della form (es. `angular2-json-schema-form`, `surveyjs`). */
  tipo?: string;
  /** Definizione della form (JSON). */
  definizione?: unknown;
  /** Solo portale pagamento: definizione dell'impaginazione (JSON). */
  impaginazione?: unknown;
}

/** Template di trasformazione dell'input in una pendenza. */
export interface TipoPendenzaTrasformazione {
  /** Tipo template (es. `freemarker`). */
  tipo?: string;
  /** Definizione del template (JSON). */
  definizione?: unknown;
}

/** Configurazione caricamento pendenze da un portale (backoffice o pagamento). */
export interface TipoPendenzaPortale {
  abilitato?: boolean;
  form?: TipoPendenzaFormDef;
  /** JSON Schema di validazione dell'input (JSON). */
  validazione?: unknown;
  trasformazione?: TipoPendenzaTrasformazione;
  /** idA2A dell'applicazione verso cui inoltrare la pendenza. */
  inoltro?: string;
}

/** Singolo promemoria (avviso / ricevuta / scadenza) di un canale di avvisatura. */
export interface TipoPendenzaPromemoria {
  abilitato?: boolean;
  tipo?: string;
  oggetto?: unknown;
  messaggio?: unknown;
  /** Solo avviso/ricevuta via mail. */
  allegaPdf?: boolean;
  /** Solo ricevuta. */
  soloEseguiti?: boolean;
  /** Solo scadenza: giorni di preavviso. */
  preavviso?: number;
}

/** Configurazione di un canale di avvisatura (mail o App IO). */
export interface TipoPendenzaAvvisatura {
  promemoriaAvviso?: TipoPendenzaPromemoria;
  promemoriaRicevuta?: TipoPendenzaPromemoria;
  promemoriaScadenza?: TipoPendenzaPromemoria;
}

/** Configurazione del tracciato CSV per il caricamento massivo. */
export interface TipoPendenzaTracciatoCsv {
  tipo?: string;
  intestazione?: string;
  richiesta?: unknown;
  risposta?: unknown;
}

/** Proiezione leggera per le liste (schema `TipoPendenzaSummary`). */
export interface TipoPendenzaSummary {
  idTipoPendenza: string;
  descrizione: string;
  abilitato?: boolean;
}

/** Dettaglio canonico (schema `TipoPendenza`). */
export interface TipoPendenza {
  idTipoPendenza: string;
  descrizione: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  portaleBackoffice?: TipoPendenzaPortale;
  portalePagamento?: TipoPendenzaPortale;
  avvisaturaMail?: TipoPendenzaAvvisatura;
  avvisaturaAppIO?: TipoPendenzaAvvisatura;
  visualizzazione?: TipoPendenzaConfig;
  tracciatoCsv?: TipoPendenzaTracciatoCsv;
}

/** Body per la creazione (schema `TipoPendenzaCreate`). */
export interface TipoPendenzaCreate {
  idTipoPendenza: string;
  descrizione: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  portaleBackoffice?: TipoPendenzaPortale;
  portalePagamento?: TipoPendenzaPortale;
  avvisaturaMail?: TipoPendenzaAvvisatura;
  avvisaturaAppIO?: TipoPendenzaAvvisatura;
  visualizzazione?: TipoPendenzaConfig;
  tracciatoCsv?: TipoPendenzaTracciatoCsv;
}

/** Body per il replace completo (schema `TipoPendenzaReplace`, id dal path). */
export interface TipoPendenzaReplace {
  descrizione: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  portaleBackoffice?: TipoPendenzaPortale;
  portalePagamento?: TipoPendenzaPortale;
  avvisaturaMail?: TipoPendenzaAvvisatura;
  avvisaturaAppIO?: TipoPendenzaAvvisatura;
  visualizzazione?: TipoPendenzaConfig;
  tracciatoCsv?: TipoPendenzaTracciatoCsv;
}

/** Filtri lista tipi pendenza + paginazione V2. */
export interface TipiPendenzaListFilters extends PaginationParams {
  /** Match parziale sul codice tipo pendenza. */
  idTipoPendenza?: string;
  /** Match parziale sulla descrizione. */
  descrizione?: string;
  /** Match esatto sullo stato di abilitazione. */
  abilitato?: boolean;
}
