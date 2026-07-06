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
 * Riferimenti condivisi (schemi `*Ref`) usati nelle associazioni di Operatori e
 * Applicazioni. In scrittura è significativo solo l'id; la label (se presente)
 * è readOnly. Il valore `*` come id indica "tutti".
 */

/** Riferimento a un dominio (schema `DominioRef`). */
export interface DominioRef {
  idDominio: string;
  ragioneSociale?: string;
}

/** Riferimento a un tipo pendenza (schema `TipoPendenzaRef`). */
export interface TipoPendenzaRef {
  idTipoPendenza: string;
  descrizione?: string;
}

/** Riferimento a un ruolo (schema `RuoloRef`). */
export interface RuoloRef {
  id: string;
}

/** Valore speciale "tutti" per `domini`/`tipiPendenza`. */
export const REF_ALL = '*';
