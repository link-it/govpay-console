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
 * Singola ACL associata a un ruolo (forma `aclPost`).
 *   - `servizio`: nome del servizio GovPay (vedi `SERVIZIO_ACL`).
 *   - `autorizzazioni`: combinazione di `R` (lettura) e/o `W` (scrittura).
 */
export interface RuoloAcl {
  servizio: string;
  autorizzazioni: Array<'R' | 'W'>;
}

/**
 * Ruolo di sistema. Il detail (`/ruoli/{idRuolo}`) include l'array `acl`
 * dei servizi concessi; la lista (`/ruoli`) restituisce solo l'id.
 */
export interface Ruolo {
  id: string;
  acl?: RuoloAcl[];
}

export interface RuoliListFilters {
  pagina?: number;
  risPerPagina?: number;
}
