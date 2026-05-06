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
 * Intermediario PagoPA — schema `intermediario` dell'OpenAPI BO.
 */
export interface Intermediario {
  idIntermediario?: string;
  denominazione: string;
  abilitato?: boolean;
  principalPagoPa?: string;
  servizioPagoPa?: Record<string, unknown>;
  servizioFtp?: Record<string, unknown>;
  servizioPagoPaRecuperoRT?: Record<string, unknown>;
  /** Sub-resource: lista delle stazioni associate. */
  stazioni?: unknown[] | string;
}

export interface IntermediariListFilters {
  pagina?: number;
  risPerPagina?: number;
  abilitato?: boolean;
}
