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
 * Modelli **Applicazioni V2** (applicazioni A2A) allineati alla GovPay Console
 * API (`/govpay-console-api/applicazioni…`, tag Applicazioni). Include il
 * connettore di integrazione (sub-resource singleton) e la codifica avvisi.
 */

import type { Acl, DominioRef, PaginationParams, RuoloRef, SslTipo, TipoPendenzaRef } from '@core/models';

/** Configurazione codifica IUV per gli avvisi (schema `CodificaAvvisi`). */
export interface CodificaAvvisi {
  codificaIuv?: string;
  regExpIuv?: string;
  generazioneIuvInterna?: boolean;
}

/** Proiezione leggera per le liste (schema `ApplicazioneSummary`). */
export interface ApplicazioneSummary {
  idA2A: string;
  principal: string;
  abilitato: boolean;
}

/** Dettaglio canonico (schema `Applicazione`). */
export interface Applicazione {
  idA2A: string;
  principal: string;
  abilitato: boolean;
  codificaAvvisi?: CodificaAvvisi;
  domini?: DominioRef[];
  tipiPendenza?: TipoPendenzaRef[];
  ruoli?: RuoloRef[];
  acl?: Acl[];
}

/** Body per la creazione (schema `ApplicazioneCreate`). */
export interface ApplicazioneCreate {
  idA2A: string;
  principal: string;
  abilitato: boolean;
  codificaAvvisi?: CodificaAvvisi;
  domini?: DominioRef[];
  tipiPendenza?: TipoPendenzaRef[];
  ruoli?: RuoloRef[];
  acl?: Acl[];
}

/** Body per il replace completo (schema `ApplicazioneReplace`, `idA2A` dal path). */
export interface ApplicazioneReplace {
  principal: string;
  abilitato: boolean;
  codificaAvvisi?: CodificaAvvisi;
  domini?: DominioRef[];
  tipiPendenza?: TipoPendenzaRef[];
  ruoli?: RuoloRef[];
  acl?: Acl[];
}

/** Versione API di integrazione. */
export type VersioneIntegrazione = 'REST_V1' | 'REST_V2';
/** Autenticazione del connettore integrazione. */
export type TipoAutIntegrazione = 'NONE' | 'BASIC' | 'SSL';

/**
 * Connettore di integrazione dell'applicazione (schema
 * `ConnettoreIntegrazioneApplicazione`). Singleton: lo slot esiste sempre
 * (`abilitato=false` se non configurato). Credenziali write-only a parte.
 */
export interface ConnettoreIntegrazioneApplicazione {
  abilitato: boolean;
  url?: string;
  versione?: VersioneIntegrazione;
  tipoAutenticazione?: TipoAutIntegrazione;
  username?: string;
  sslTipo?: SslTipo;
  ksLocation?: string;
  ksType?: string;
  tsLocation?: string;
  tsType?: string;
  sslType?: string;
  connectTimeoutMs?: number;
  readTimeoutMs?: number;
}

/** Filtri lista applicazioni + paginazione V2. */
export interface ApplicazioniListFilters extends PaginationParams {
  /** Match parziale sull'idA2A. */
  idA2A?: string;
  /** Match parziale sul principal. */
  principal?: string;
  /** Match esatto sullo stato di abilitazione. */
  abilitato?: boolean;
}
