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
 * Modelli **Intermediari V2** allineati alla GovPay Console API
 * (`/govpay-console-api/intermediari…`, schema OpenAPI in
 * `NOTE-CLAUDE/REFACTORING-NUOVE-API-PENDENZE/openapi.yaml`, tag Intermediari/
 * Stazioni/Connettori).
 *
 * File **transitorio**: convive col V1 `intermediario.model.ts` (tuttora usato
 * dai componenti lista/dettaglio su form/v1) finché il cutover UI non rimuove il
 * V1. A cutover concluso: rinominare in `intermediario.model.ts`, eliminare il V1.
 *
 * Nota: i tipi di **scrittura** (`*Create`/`*Replace`, connettori/credenziali)
 * sono definiti qui ma il client li userà solo nelle fasi di write (read-first).
 */

import type {
  ConnettoreAuth,
  ConnettoreCredenziali,
  DominioSummary,
  PaginationParams,
  SslTipo,
  TipoAutenticazioneConnettore,
} from '@core/models';

/* =========================================================================
 * Intermediario
 * ========================================================================= */

/** Proiezione leggera per le liste (schema `IntermediarioSummary`). */
export interface IntermediarioSummary {
  idIntermediario: string;
  denominazione: string;
  abilitato: boolean;
}

/** Dettaglio canonico (schema `Intermediario`). */
export interface Intermediario {
  idIntermediario: string;
  denominazione: string;
  /** Principal con cui pagoPA autentica le richieste in ingresso. */
  principalPagoPa: string;
  abilitato: boolean;
}

/** Body per la creazione (schema `IntermediarioCreate`). */
export interface IntermediarioCreate {
  idIntermediario: string;
  denominazione: string;
  principalPagoPa: string;
  abilitato: boolean;
}

/** Body per il replace completo (schema `IntermediarioReplace`, id dal path). */
export interface IntermediarioReplace {
  denominazione: string;
  principalPagoPa: string;
  abilitato: boolean;
}

/** Filtri lista intermediari + paginazione V2. */
export interface IntermediariListFilters extends PaginationParams {
  /** Match parziale sul codice intermediario. */
  codIntermediario?: string;
  /** Match parziale sulla denominazione. */
  denominazione?: string;
  /** Match esatto sullo stato di abilitazione. */
  abilitato?: boolean;
}

/* =========================================================================
 * Stazioni (sub-resource)
 * ========================================================================= */

/** Versione del protocollo pagoPA della stazione (schema `VersioneStazione`). */
export type VersioneStazione = 'V1' | 'V2';

/** Proiezione leggera della stazione (schema `StazioneSummary`). */
export interface StazioneSummary {
  /** `{idIntermediario}_{applicationCode}` (applicationCode 1–99). */
  idStazione: string;
  versione: VersioneStazione;
  abilitato: boolean;
}

/** Dettaglio stazione (schema `Stazione`). `domini` è sola lettura. */
export interface Stazione {
  idStazione: string;
  versione: VersioneStazione;
  abilitato: boolean;
  /** Domini associati alla stazione (read-only). */
  domini: DominioSummary[];
}

/** Body creazione stazione (schema `StazioneCreate`). */
export interface StazioneCreate {
  idStazione: string;
  versione: VersioneStazione;
  abilitato: boolean;
}

/** Body replace stazione (schema `StazioneReplace`, id dal path; `domini` non modificabile). */
export interface StazioneReplace {
  versione: VersioneStazione;
  abilitato: boolean;
}

/** Filtri lista stazioni + paginazione V2. */
export interface StazioniListFilters extends PaginationParams {
  /** Match parziale sul codice stazione. */
  codStazione?: string;
  abilitato?: boolean;
}

/* =========================================================================
 * Connettori (6 tipi)
 * ========================================================================= */

/** Tipo di connettore pagoPA (segmento di path). */
export type TipoConnettore =
  | 'pagopa'
  | 'pagopa-aca'
  | 'pagopa-gpd'
  | 'pagopa-fr'
  | 'pagopa-backoffice-ec'
  | 'pagopa-recupero-rt';

/** Elenco dei tipi connettore, per iterare in UI. */
export const TIPI_CONNETTORE: TipoConnettore[] = [
  'pagopa',
  'pagopa-aca',
  'pagopa-gpd',
  'pagopa-fr',
  'pagopa-backoffice-ec',
  'pagopa-recupero-rt',
];

/**
 * Connettore pagoPA (unione dei 6 schemi `ConnettoreIntermediario*`, credenziali
 * escluse). `urlRPT` è specifico del connettore PDD (`pagopa`); `url`+`abilitaGDE`
 * degli altri cinque. Lo slot esiste sempre: se non configurato `abilitato=false`.
 */
export interface Connettore {
  abilitato: boolean;
  auth: ConnettoreAuth;
  /** Solo connettore `pagopa` (PDD). */
  urlRPT?: string;
  /** Connettori diversi da `pagopa`. */
  url?: string;
  /** Connettori diversi da `pagopa`. */
  abilitaGDE?: boolean;
}

// I primitivi condivisi `ConnettoreAuth`, `ConnettoreCredenziali`, `SslTipo`,
// `TipoAutenticazioneConnettore` vivono in `@core/models` (riusati da connettori
// dominio e connettore integrazione). Re-export per compatibilità degli import.
export type { ConnettoreAuth, ConnettoreCredenziali, SslTipo, TipoAutenticazioneConnettore };
