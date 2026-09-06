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

import type { ConnettoreAuth } from '@core/models';

/**
 * Modelli **Impostazioni — Console API V2** (`/impostazioni`).
 *
 * L'overview espone le 8 sotto-risorse indipendenti in cui è stato scomposto
 * il blob V1 `configurazione`. Ogni sotto-risorsa è un singleton GET/PUT/PATCH;
 * i segreti (password/credenziali) stanno su endpoint dedicati write-only e
 * non sono mai restituiti dalle GET.
 */

/** Riepilogo di una sotto-risorsa (schema `AreaImpostazioni`). */
export interface AreaImpostazioni {
  codice: string;
  nome: string;
  href: string;
  /** Presente solo per le aree con flag on/off (connettori, hardening). */
  abilitata?: boolean;
  /** ISO 8601; assente se mai modificata dopo il deploy. */
  ultimaModifica?: string;
}

/** Overview delle aree (schema `ImpostazioniOverview`). */
export interface ImpostazioniOverview {
  aree: AreaImpostazioni[];
}

/* ── servizioGDE (connettore) ─────────────────────────────────────── */

/** Connettore verso il Giornale Eventi (schema `ImpostazioniServizioGDE`). */
export interface ImpostazioniServizioGDE {
  abilitato: boolean;
  url?: string;
  auth?: ConnettoreAuth;
}

/* ── giornale-eventi (politica di logging) ────────────────────────── */

export type GdePolitica = 'SEMPRE' | 'MAI' | 'SOLO_ERRORE';

/** Politica di logging di un evento (schema `GdeEvento`). */
export interface GdeEvento {
  log: GdePolitica;
  dump: GdePolitica;
}

/** Politica per un'interfaccia API, separata letture/scritture (schema `GdeInterfaccia`). */
export interface GdeInterfaccia {
  letture: GdeEvento;
  scritture: GdeEvento;
}

/** Le 8 interfacce API con la relativa politica GDE (schema `ImpostazioniGiornaleEventi`). */
export interface ImpostazioniGiornaleEventi {
  apiEnte: GdeInterfaccia;
  apiPagamento: GdeInterfaccia;
  apiRagioneria: GdeInterfaccia;
  apiBackoffice: GdeInterfaccia;
  apiPagoPA: GdeInterfaccia;
  apiPendenze: GdeInterfaccia;
  apiBackendIO: GdeInterfaccia;
  apiMaggioliJPPA: GdeInterfaccia;
}

/** Chiavi delle 8 interfacce (per iterare nel form). */
export const GDE_INTERFACCE: readonly (keyof ImpostazioniGiornaleEventi)[] = [
  'apiEnte', 'apiPagamento', 'apiRagioneria', 'apiBackoffice',
  'apiPagoPA', 'apiPendenze', 'apiBackendIO', 'apiMaggioliJPPA',
];

/* ── mail/server ──────────────────────────────────────────────────── */

/** Riferimento keystore/truststore Java (schema `MailKeyStore`). */
export interface MailKeyStore {
  location?: string;
  tipo?: string;
  managementAlgorithm?: string;
}

/** Config SSL/TLS del server SMTP (schema `ImpostazioniMailServerSsl`). */
export interface ImpostazioniMailServerSsl {
  abilitato: boolean;
  tipo?: string;
  hostnameVerifier?: boolean;
  trustStore?: MailKeyStore;
  keyStore?: MailKeyStore;
}

/** Server SMTP per i promemoria (schema `ImpostazioniMailServer`). */
export interface ImpostazioniMailServer {
  abilitato: boolean;
  host?: string;
  port?: number;
  username?: string;
  from?: string;
  readTimeoutMs?: number;
  connectionTimeoutMs?: number;
  startTls?: boolean;
  ssl?: ImpostazioniMailServerSsl;
  /** readOnly: se una password SMTP è stata configurata. */
  passwordImpostata?: boolean;
}

/** Credenziali SMTP write-only (schema `ImpostazioniMailServerCredenziali`). */
export interface ImpostazioniMailServerCredenziali {
  nuovaPassword?: string;
  ksPassword?: string;
  tsPassword?: string;
}

/* ── template promemoria (mail + app-io) ──────────────────────────── */

export type TipoTemplateTrasformazione = 'freemarker';

export interface TemplatePromemoriaAvviso {
  tipo: TipoTemplateTrasformazione;
  oggetto?: string;
  messaggio?: string;
  allegaPdf?: boolean;
}

export interface TemplatePromemoriaRicevuta {
  tipo: TipoTemplateTrasformazione;
  oggetto?: string;
  messaggio?: string;
  soloEseguiti?: boolean;
  allegaPdf?: boolean;
}

export interface TemplatePromemoriaScadenza {
  tipo: TipoTemplateTrasformazione;
  oggetto?: string;
  messaggio?: string;
  /** Giorni prima della scadenza per l'invio. */
  preavviso?: number;
}

/** Template promemoria via mail (schema `ImpostazioniMailTemplatePromemoria`). */
export interface ImpostazioniMailTemplatePromemoria {
  promemoriaAvviso: TemplatePromemoriaAvviso;
  promemoriaRicevuta: TemplatePromemoriaRicevuta;
  promemoriaScadenza: TemplatePromemoriaScadenza;
}

/** Variante push (senza allegato) del template avviso (schema `TemplatePromemoriaAvvisoBase`). */
export interface TemplatePromemoriaAvvisoBase {
  tipo: TipoTemplateTrasformazione;
  oggetto?: string;
  messaggio?: string;
}

/** Variante push del template ricevuta (schema `TemplatePromemoriaRicevutaBase`). */
export interface TemplatePromemoriaRicevutaBase {
  tipo: TipoTemplateTrasformazione;
  oggetto?: string;
  messaggio?: string;
  soloEseguiti?: boolean;
}

/** Template promemoria via App IO (schema `ImpostazioniAppIoTemplatePromemoria`). */
export interface ImpostazioniAppIoTemplatePromemoria {
  promemoriaAvviso: TemplatePromemoriaAvvisoBase;
  promemoriaRicevuta: TemplatePromemoriaRicevutaBase;
  promemoriaScadenza: TemplatePromemoriaScadenza;
}

/* ── app-io/server (connettore) ───────────────────────────────────── */

/** Connettore verso App IO (schema `ImpostazioniAppIoServer`). */
export interface ImpostazioniAppIoServer {
  abilitato: boolean;
  url?: string;
  timeToLiveSecondi?: number;
  auth?: ConnettoreAuth;
}

/* ── tracciati-csv ────────────────────────────────────────────────── */

/** Template FreeMarker dei tracciati CSV (schema `ImpostazioniTracciatiCsv`). */
export interface ImpostazioniTracciatiCsv {
  tipo: TipoTemplateTrasformazione;
  intestazione: string;
  richiesta: string;
  risposta: string;
}

/* ── hardening (reCAPTCHA) ────────────────────────────────────────── */

/** Config Google reCAPTCHA (schema `ConfigurazioneReCaptcha`). */
export interface ConfigurazioneReCaptcha {
  serverURL?: string;
  siteKey?: string;
  soglia?: number;
  parametro?: string;
  denyOnFail?: boolean;
  connectionTimeoutMs?: number;
  readTimeoutMs?: number;
}

/** Hardening login (schema `ImpostazioniHardening`). */
export interface ImpostazioniHardening {
  abilitato: boolean;
  captcha: ConfigurazioneReCaptcha;
}

/** Chiave segreta reCAPTCHA write-only (schema `ImpostazioniHardeningCredenziali`). */
export interface ImpostazioniHardeningCredenziali {
  secretKey?: string;
}
