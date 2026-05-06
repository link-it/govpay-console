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
 * Applicazione A2A — schema `applicazione` dell'OpenAPI GovPay BO.
 */
export interface Applicazione {
  idA2A: string;
  principal: string;
  abilitato?: boolean;
  apiPagamenti?: boolean;
  apiPendenze?: boolean;
  apiRagioneria?: boolean;
  domini?: Array<{ idDominio: string } | string>;
  tipiPendenza?: string[];
  ruoli?: string[];
  acl?: Array<Record<string, unknown>>;
  codificaAvvisi?: Record<string, unknown>;
  servizioIntegrazione?: Record<string, unknown>;
}

export interface ApplicazioniListFilters {
  pagina?: number;
  risPerPagina?: number;
  ordinamento?: string;
  abilitato?: boolean;
}
