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
 * Operatore — utente del cruscotto. Schema `operatore` dell'OpenAPI.
 */
export interface Operatore {
  principal: string;
  ragioneSociale: string;
  abilitato?: boolean;
  domini?: Array<{ idDominio: string } | string>;
  tipiPendenza?: string[];
  ruoli?: string[];
  acl?: Array<Record<string, unknown>>;
}

export interface OperatoriListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  abilitato?: boolean;
}
