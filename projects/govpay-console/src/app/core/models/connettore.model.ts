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
 * Primitivi condivisi dei connettori della Console API V2. Riusati da più aree:
 * connettori intermediario (pagoPA), connettori dominio (mypivot/secim/govpay/…)
 * e connettore integrazione applicazione.
 */

/** Tipo di autenticazione del connettore (schema `TipoAutenticazioneConnettore`). */
export type TipoAutenticazioneConnettore =
  | 'NONE'
  | 'HTTPBASIC'
  | 'SSL'
  | 'HEADER'
  | 'APIKEY'
  | 'OAUTH2';

/** Modalità SSL quando `tipoAutenticazione = SSL` (schema `SslTipo`). */
export type SslTipo = 'CLIENT' | 'SERVER';

/** Parametri di autenticazione del connettore — **senza credenziali** (schema `ConnettoreAuth`). */
export interface ConnettoreAuth {
  tipoAutenticazione: TipoAutenticazioneConnettore;
  username?: string;
  sslTipo?: SslTipo;
  ksLocation?: string;
  ksType?: string;
  tsLocation?: string;
  tsType?: string;
  sslType?: string;
  headerName?: string;
  apiId?: string;
  clientId?: string;
  scope?: string;
  urlTokenEndpoint?: string;
}

/**
 * Credenziali del connettore (**write-only**, schema `ConnettoreCredenziali`).
 * Mai restituite dalle GET; significative solo quelle coerenti col
 * `tipoAutenticazione`.
 */
export interface ConnettoreCredenziali {
  subscriptionKey?: string;
  password?: string;
  ksPassword?: string;
  tsPassword?: string;
  ksPKeyPasswd?: string;
  headerValue?: string;
  apiKey?: string;
  clientSecret?: string;
}
