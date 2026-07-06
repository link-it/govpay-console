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
 * ACL condivise (schema `Acl`/`AclServizio`) — riusate da Ruoli, Operatori,
 * Applicazioni. `AclServizio` sono le label V1 (`it.govpay.model.Acl.Servizio`).
 */

/** Servizio oggetto dell'autorizzazione (schema `AclServizio`, label V1). */
export type AclServizio =
  | 'Anagrafica PagoPA'
  | 'Anagrafica Creditore'
  | 'Anagrafica Applicazioni'
  | 'Anagrafica Ruoli'
  | 'Pagamenti'
  | 'Pendenze'
  | 'Rendicontazioni e Incassi'
  | 'Giornale degli Eventi'
  | 'Configurazione e manutenzione'
  | 'API Pagamenti'
  | 'API Pendenze'
  | 'API Ragioneria';

/** Elenco ordinato dei servizi ACL (per gli editor). */
export const ACL_SERVIZI: AclServizio[] = [
  'Anagrafica PagoPA',
  'Anagrafica Creditore',
  'Anagrafica Applicazioni',
  'Anagrafica Ruoli',
  'Pagamenti',
  'Pendenze',
  'Rendicontazioni e Incassi',
  'Giornale degli Eventi',
  'Configurazione e manutenzione',
  'API Pagamenti',
  'API Pendenze',
  'API Ragioneria',
];

/** Autorizzazione: lettura (`R`) e/o scrittura (`W`). */
export type Autorizzazione = 'R' | 'W';

/** Entry ACL appiattita (schema `Acl`). */
export interface Acl {
  servizio: AclServizio;
  /** Almeno una tra `R`/`W`. */
  autorizzazioni: Autorizzazione[];
  /** Solo readOnly: ruolo che ha originato l'entry (se deriva dal catalogo). */
  ruolo?: string;
}
