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
 * Tipi "summary" condivisi tra più feature GovPay su **API V1** (form/v1).
 *
 * Vivevano in `features/pendenze/pendenza.model.ts` finché la feature Pendenze
 * è passata a V2: per non accoppiare le altre feature (ricevute, incassi,
 * tracciati, pagamenti) al modello Pendenze, i tipi realmente condivisi sono
 * stati promossi qui in `@core/models`.
 */

/** Riferimento sintetico a un dominio (ente creditore) nelle risposte V1. */
export interface DominioSummary {
  idDominio: string;
  ragioneSociale: string;
}

/** Soggetto pagatore inline nelle risposte V1 (pendenze/ricevute/pagamenti). */
export interface SoggettoPagatore {
  /** Tipo identificativo: `F` (persona fisica) o `G` (giuridica). */
  tipo?: 'F' | 'G';
  identificativo: string;
  anagrafica: string;
  email?: string;
  cellulare?: string;
}
