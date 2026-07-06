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
 * Modelli **Ruoli V2** (catalogo ruoli + ACL) allineati alla GovPay Console API
 * (`/govpay-console-api/ruoli…`, tag Ruoli).
 */

import type { Acl, PaginationParams } from '@core/models';

/** Proiezione leggera per le liste (schema `RuoloSummary`). */
export interface RuoloSummary {
  idRuolo: string;
}

/** Dettaglio canonico (schema `Ruolo`). */
export interface Ruolo {
  idRuolo: string;
  acl: Acl[];
}

/** Body per la creazione (schema `RuoloCreate`, `acl` con almeno una entry). */
export interface RuoloCreate {
  idRuolo: string;
  acl: Acl[];
}

/** Body per il replace completo (schema `RuoloReplace`, `idRuolo` dal path). */
export interface RuoloReplace {
  acl: Acl[];
}

/** Filtri lista ruoli + paginazione V2. */
export interface RuoliListFilters extends PaginationParams {
  /** Match parziale sull'identificativo ruolo. */
  idRuolo?: string;
}
