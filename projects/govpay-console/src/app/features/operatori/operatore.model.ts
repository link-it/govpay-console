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
 * Modelli **Operatori V2** (utenti della console) allineati alla GovPay Console
 * API (`/govpay-console-api/operatori…`, tag Operatori). Identificati dal
 * `principal`; associazioni domini/tipiPendenza/ruoli/acl. La password si imposta
 * con endpoint dedicato (non gestito qui).
 */

import type { Acl, DominioRef, PaginationParams, RuoloRef, TipoPendenzaRef } from '@core/models';

/** Proiezione leggera per le liste (schema `OperatoreSummary`). */
export interface OperatoreSummary {
  principal: string;
  nome: string;
  abilitato: boolean;
}

/** Dettaglio canonico (schema `Operatore`). */
export interface Operatore {
  principal: string;
  nome: string;
  abilitato: boolean;
  domini?: DominioRef[];
  tipiPendenza?: TipoPendenzaRef[];
  ruoli?: RuoloRef[];
  acl?: Acl[];
  /**
   * Preferenze UI dell'operatore (JSON libero, non interpretato dal server).
   * Gestite dall'operatore stesso via `PATCH /profilo`; l'editor operatori NON
   * le modifica ma le preserva nel replace per non azzerarle.
   */
  preferenze?: Record<string, unknown>;
}

/** Body per la creazione (schema `OperatoreCreate`). */
export interface OperatoreCreate {
  principal: string;
  nome: string;
  abilitato: boolean;
  domini?: DominioRef[];
  tipiPendenza?: TipoPendenzaRef[];
  ruoli?: RuoloRef[];
  acl?: Acl[];
  preferenze?: Record<string, unknown>;
}

/** Body per il replace completo (schema `OperatoreReplace`, `principal` dal path). */
export interface OperatoreReplace {
  nome: string;
  abilitato: boolean;
  domini?: DominioRef[];
  tipiPendenza?: TipoPendenzaRef[];
  ruoli?: RuoloRef[];
  acl?: Acl[];
  /** Round-trip delle preferenze esistenti: l'editor non le tocca ma le conserva. */
  preferenze?: Record<string, unknown>;
}

/** Filtri lista operatori + paginazione V2. */
export interface OperatoriListFilters extends PaginationParams {
  /** Match parziale sul principal. */
  principal?: string;
  /** Match parziale sul nome. */
  nome?: string;
  /** Match esatto sullo stato di abilitazione. */
  abilitato?: boolean;
}
