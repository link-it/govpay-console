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

/** Blocco di configurazione opaco (non editato dall'UI base). */
export type TipoPendenzaConfig = Record<string, unknown>;

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
  portaleBackoffice?: TipoPendenzaConfig;
  portalePagamento?: TipoPendenzaConfig;
  avvisaturaMail?: TipoPendenzaConfig;
  avvisaturaAppIO?: TipoPendenzaConfig;
  visualizzazione?: TipoPendenzaConfig;
  tracciatoCsv?: TipoPendenzaConfig;
}

/** Body per la creazione (schema `TipoPendenzaCreate`). */
export interface TipoPendenzaCreate {
  idTipoPendenza: string;
  descrizione: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  portaleBackoffice?: TipoPendenzaConfig;
  portalePagamento?: TipoPendenzaConfig;
  avvisaturaMail?: TipoPendenzaConfig;
  avvisaturaAppIO?: TipoPendenzaConfig;
  visualizzazione?: TipoPendenzaConfig;
  tracciatoCsv?: TipoPendenzaConfig;
}

/** Body per il replace completo (schema `TipoPendenzaReplace`, id dal path). */
export interface TipoPendenzaReplace {
  descrizione: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  portaleBackoffice?: TipoPendenzaConfig;
  portalePagamento?: TipoPendenzaConfig;
  avvisaturaMail?: TipoPendenzaConfig;
  avvisaturaAppIO?: TipoPendenzaConfig;
  visualizzazione?: TipoPendenzaConfig;
  tracciatoCsv?: TipoPendenzaConfig;
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
