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

import type { AuthMode } from '../../config/app-config.model';

/**
 * Risposta grezza di `GET /profilo` del backend GovPay.
 * Esempio reale (DEMO):
 *   ```json
 *   {
 *     "nome": "Mario Rossi",
 *     "domini": [{ "idDominio": "*", "ragioneSociale": "Tutti" }],
 *     "tipiPendenza": [{ "idTipoPendenza": "*", "descrizione": "Tutti", "pagaTerzi": false, "abilitato": true }],
 *     "acl": [{ "servizio": "Pagamenti", "autorizzazioni": ["R", "W"] }, ...],
 *     "autenticazione": "BASIC"
 *   }
 *   ```
 */
export interface ProfiloResponse {
  nome?: string;
  /** Identificativo dell'utente, alcune modalità d'autenticazione lo restituiscono separatamente. */
  principal?: string;
  email?: string;
  domini?: ProfiloDominio[];
  tipiPendenza?: ProfiloTipoPendenza[];
  acl?: ProfiloAcl[];
  autenticazione?: 'BASIC' | 'SPID' | 'IAM' | 'OAUTH2' | string;
}

export interface ProfiloDominio {
  idDominio: string;
  ragioneSociale?: string;
}

export interface ProfiloTipoPendenza {
  idTipoPendenza: string;
  descrizione?: string;
  pagaTerzi?: boolean;
  abilitato?: boolean;
}

export type AutorizzazioneAcl = 'R' | 'W';

/**
 * Servizi noti del backend GovPay (legacy `SERVIZI_ACL`).
 * I valori sono i `servizio` letterali ricevuti dal `/profilo`.
 */
export const SERVIZIO_ACL = {
  AnagraficaPagoPA: 'Anagrafica PagoPA',
  AnagraficaCreditore: 'Anagrafica Creditore',
  AnagraficaApplicazioni: 'Anagrafica Applicazioni',
  AnagraficaRuoli: 'Anagrafica Ruoli',
  Pagamenti: 'Pagamenti',
  Pendenze: 'Pendenze',
  RendicontazioniIncassi: 'Rendicontazioni e Incassi',
  GiornaleEventi: 'Giornale degli Eventi',
  Configurazione: 'Configurazione e manutenzione',
} as const;

export type ServizioAcl = (typeof SERVIZIO_ACL)[keyof typeof SERVIZIO_ACL];

export interface ProfiloAcl {
  servizio: ServizioAcl | string;
  autorizzazioni: AutorizzazioneAcl[];
}

/**
 * Utente autenticato in console: forma normalizzata per i guard, la nav e la UI.
 *
 * - `acl` flag boolean derivate da `ProfiloAcl[]` (vedi `mapProfileToUser`).
 * - `domini` / `tipiPendenza` conservati grezzi per il filtraggio runtime
 *   (es. liste filtrate per i domini in scope dell'utente).
 * - `aclRaw` conservato per debug e per servizi che richiedono la distinzione R/W.
 */
export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  /** ACL boolean flag derivate dai servizi della risposta `/profilo`. */
  acl?: AuthAcl;
  /** Domini in scope per l'utente (`*` = tutti). */
  domini?: ProfiloDominio[];
  /** Tipi pendenza in scope per l'utente (`*` = tutti). */
  tipiPendenza?: ProfiloTipoPendenza[];
  /** ACL grezze per servizio (utile per scriminare R vs W). */
  aclRaw?: ProfiloAcl[];
  /** Strategia di autenticazione effettiva sul server (BASIC, SPID, ...). */
  autenticazione?: string;
}

export interface AuthAcl {
  hasPagoPA?: boolean;
  hasCreditore?: boolean;
  hasApplicazioni?: boolean;
  hasRuoli?: boolean;
  hasPagamentiePendenze?: boolean;
  hasPagamenti?: boolean;
  hasPendenze?: boolean;
  hasRendiIncassi?: boolean;
  hasGdE?: boolean;
  hasConfig?: boolean;
  hasSetting?: boolean;
  hasTuttiDomini?: boolean;
  hasTuttiTipiPendenza?: boolean;
  /** Almeno un servizio in cui l'utente abbia il bit `W` di scrittura. */
  hasScrittura?: boolean;
}

export interface AuthState {
  mode: AuthMode | null;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const INITIAL_AUTH_STATE: AuthState = {
  mode: null,
  user: null,
  token: null,
  loading: false,
  error: null,
};

/**
 * Mappa una `ProfiloResponse` grezza nel modello `AuthUser` consumato dall'app.
 * Le ACL boolean derivano dai servizi presenti (e che hanno almeno il bit `R`).
 *
 * - `principalFallback` viene usato come `id`/`username` se la risposta non contiene
 *   `principal` (tipico caso di Basic auth, dove l'username lo conosciamo dal client).
 */
export function mapProfileToUser(
  p: ProfiloResponse,
  principalFallback?: string
): AuthUser {
  const principal = p.principal ?? principalFallback ?? p.nome ?? '';
  const aclRaw = p.acl ?? [];
  const acl = mapAclArray(aclRaw);
  const domini = p.domini ?? [];
  const tipiPendenza = p.tipiPendenza ?? [];

  acl.hasTuttiDomini = domini.some((d) => d.idDominio === '*');
  acl.hasTuttiTipiPendenza = tipiPendenza.some((t) => t.idTipoPendenza === '*');
  acl.hasPagamentiePendenze = !!(acl.hasPagamenti && acl.hasPendenze);
  acl.hasScrittura = aclRaw.some((s) => s.autorizzazioni?.includes('W'));

  return {
    id: principal,
    username: principal,
    displayName: p.nome,
    email: p.email,
    acl,
    domini,
    tipiPendenza,
    aclRaw,
    autenticazione: p.autenticazione,
  };
}

/**
 * Deriva le flag boolean `AuthAcl` dall'array di servizi.
 * Un servizio è "concesso" se include almeno l'autorizzazione `R`.
 */
export function mapAclArray(acl: ProfiloAcl[]): AuthAcl {
  const has = (servizio: string): boolean =>
    acl.some((a) => a.servizio === servizio && a.autorizzazioni?.includes('R'));

  const out: AuthAcl = {
    hasPagoPA: has(SERVIZIO_ACL.AnagraficaPagoPA),
    hasCreditore: has(SERVIZIO_ACL.AnagraficaCreditore),
    hasApplicazioni: has(SERVIZIO_ACL.AnagraficaApplicazioni),
    hasRuoli: has(SERVIZIO_ACL.AnagraficaRuoli),
    hasPagamenti: has(SERVIZIO_ACL.Pagamenti),
    hasPendenze: has(SERVIZIO_ACL.Pendenze),
    hasRendiIncassi: has(SERVIZIO_ACL.RendicontazioniIncassi),
    hasGdE: has(SERVIZIO_ACL.GiornaleEventi),
    hasSetting: has(SERVIZIO_ACL.Configurazione),
  };
  // `hasConfig` è l'alias storico per la gestione di Domini/TipiPendenza/Operatori,
  // che lato GovPay è coperta dall'ACL su "Anagrafica Creditore".
  out.hasConfig = out.hasCreditore;
  return out;
}

/**
 * Verifica se l'utente ha autorizzazione `W` su un servizio specifico.
 * Utile nelle UI di dettaglio per abilitare/disabilitare azioni di modifica.
 */
export function canWrite(user: AuthUser | null | undefined, servizio: ServizioAcl): boolean {
  if (!user?.aclRaw) return false;
  return user.aclRaw.some((a) => a.servizio === servizio && a.autorizzazioni?.includes('W'));
}
