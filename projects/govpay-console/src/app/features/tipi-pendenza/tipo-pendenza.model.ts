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
 * Tipologia di pendenza — schema `tipoPendenza` dell'OpenAPI GovPay BO.
 * I sotto-oggetti `portaleBackoffice` / `portalePagamento` / `avvisatura*`
 * / `visualizzazione` / `tracciatoCsv` sono opachi: li tipizziamo come
 * `Record<string, unknown>` per non duplicare schemi profondi.
 */
export interface TipoPendenza {
  idTipoPendenza: string;
  descrizione: string;
  codificaIUV?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
  portaleBackoffice?: Record<string, unknown>;
  portalePagamento?: Record<string, unknown>;
  avvisaturaMail?: Record<string, unknown>;
  avvisaturaAppIO?: Record<string, unknown>;
  visualizzazione?: Record<string, unknown>;
  tracciatoCsv?: Record<string, unknown>;
}

export interface TipiPendenzaListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  idTipoPendenza?: string;
  descrizione?: string;
  abilitato?: boolean;
}
