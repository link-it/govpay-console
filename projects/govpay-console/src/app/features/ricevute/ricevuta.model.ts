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
 * Modelli **Ricevute V2** (Ricevute Telematiche, RT) allineati alla GovPay
 * Console API (`/govpay-console-api/ricevute…`, tag Ricevute). Consultazione
 * read-only: la lista espone solo metadati tecnico-finanziari
 * (`RicevutaSummary`, no dati personali); il dettaglio (`Ricevuta`) include la
 * conversione JSON di `rpt`/`rt` e gli hyperlink ai sub-resource.
 */

import type { PaginationParams } from '@core/models';

/** Hyperlink stile HAL (schema `Link`). */
export interface Link {
  href: string;
  type?: string;
}

/**
 * Stato nativo della RT così come restituito dal backend (stringa V1, es.
 * `RT_ACCETTATA_PA`). Modellato come union dei valori noti; il tipo effettivo
 * resta `string` per tollerare stati non previsti.
 */
export type StatoRt =
  | 'RT_ACCETTATA_PA'
  | 'RT_RIFIUTATA_PA'
  | 'RT_ESITO_SCONOSCIUTO_PA'
  | 'RPT_ATTIVATA'
  | 'RPT_ACCETTATA_NODO'
  | 'RPT_ACCETTATA_PSP'
  | 'RPT_RIFIUTATA_NODO'
  | 'RPT_RIFIUTATA_PSP'
  | 'RPT_ERRORE_INVIO_A_PSP'
  | 'RPT_ANNULLATA'
  | 'RPT_SCADUTA';

/** Proiezione leggera (schema `RicevutaSummary`), metadata-only. */
export interface RicevutaSummary {
  idDominio: string;
  iuv: string;
  idRicevuta: string;
  dataPagamento: string;
  codPsp?: string;
  versione?: string;
  stato: string;
  descrizioneStato?: string;
  importo?: number;
}

/** Evento/nota del Nodo associati alla RT (schema `Segnalazione`). */
export interface Segnalazione {
  data?: string;
  codice?: string;
  descrizione?: string;
}

/** Riferimento minimale alla pendenza associata (schema `PendenzaRef`). */
export interface PendenzaRef {
  idA2A: string;
  idPendenza: string;
  causaleBreve?: string;
}

/** Identificativo univoco di un soggetto pagoPA (persona fisica `F` / giuridica `G`). */
export interface RtUniqueIdentifier {
  entityUniqueIdentifierType?: string;
  entityUniqueIdentifierValue?: string;
}

/** Soggetto (debitore/versante) nella conversione JSON di RT/RPT. */
export interface RtSoggetto {
  uniqueIdentifier?: RtUniqueIdentifier;
  fullName?: string;
  'e-mail'?: string;
}

/** Singolo trasferimento pagoPA (schema `ctTransfer`). */
export interface RtTransfer {
  idTransfer?: number;
  transferAmount?: string;
  fiscalCodePA?: string;
  IBAN?: string;
  remittanceInformation?: string;
  transferCategory?: string;
}

/** Elenco trasferimenti. */
export interface RtTransferList {
  transfer?: RtTransfer[];
}

/** Conversione JSON della Ricevuta Telematica (campi pagoPA `paSendRT`). */
export interface RtDettaglio {
  receiptId?: string;
  noticeNumber?: string;
  fiscalCode?: string;
  outcome?: string;
  creditorReferenceId?: string;
  paymentAmount?: string;
  description?: string;
  companyName?: string;
  debtor?: RtSoggetto;
  transferList?: RtTransferList;
  idPSP?: string;
  pspFiscalCode?: string;
  PSPCompanyName?: string;
  idChannel?: string;
  channelDescription?: string;
  paymentMethod?: string;
  fee?: string;
  paymentDateTime?: string;
  applicationDate?: string;
  transferDate?: string;
  [k: string]: unknown;
}

/** Conversione JSON della Richiesta di Pagamento Telematica (campi pagoPA). */
export interface RptDettaglio {
  creditorReferenceId?: string;
  paymentAmount?: string;
  dueDate?: string;
  lastPayment?: boolean;
  description?: string;
  companyName?: string;
  debtor?: RtSoggetto;
  transferList?: RtTransferList;
  [k: string]: unknown;
}

/** Hyperlink della ricevuta (schema `RicevutaLinks`). */
export interface RicevutaLinks {
  rpt: Link;
  rt: Link;
  pendenza?: Link;
  [rel: string]: Link | undefined;
}

/** Dettaglio canonico (schema `Ricevuta`). */
export interface Ricevuta extends RicevutaSummary {
  /** Conversione JSON della RPT; `null` se non disponibile (RT in standin). */
  rpt?: RptDettaglio | null;
  /** Conversione JSON della RT; sempre presente nel dettaglio. */
  rt: RtDettaglio;
  segnalazioni?: Segnalazione[];
  pendenza?: PendenzaRef;
  _links: RicevutaLinks;
}

/** Formato di download di un sub-resource RPT/RT. */
export type RicevutaFormato = 'json' | 'xml' | 'pdf';

/** Filtri lista ricevute + paginazione V2 (offset o cursor). */
export interface RicevuteListFilters extends PaginationParams {
  /** Match esatto sullo IUV. */
  iuv?: string;
  /** Match esatto sul codice dominio (11 cifre). */
  idDominio?: string;
  /** Match esatto sull'identificativo ricevuta (era `ccp` in V1). */
  idRicevuta?: string;
  /** Intervallo (incluso) sulla data di pagamento — `YYYY-MM-DDTHH:MM`. */
  dataDa?: string;
  dataA?: string;
}

/** Label i18n per gli stati RT noti. */
export const STATO_RT_LABEL: Record<StatoRt, string> = {
  RT_ACCETTATA_PA: 'Ricevute.Stati.Eseguito',
  RT_RIFIUTATA_PA: 'Ricevute.Stati.RtRifiutata',
  RT_ESITO_SCONOSCIUTO_PA: 'Ricevute.Stati.Sconosciuto',
  RPT_ATTIVATA: 'Ricevute.Stati.InCorso',
  RPT_ACCETTATA_NODO: 'Ricevute.Stati.InCorso',
  RPT_ACCETTATA_PSP: 'Ricevute.Stati.InCorso',
  RPT_RIFIUTATA_NODO: 'Ricevute.Stati.Fallito',
  RPT_RIFIUTATA_PSP: 'Ricevute.Stati.Fallito',
  RPT_ERRORE_INVIO_A_PSP: 'Ricevute.Stati.Fallito',
  RPT_ANNULLATA: 'Ricevute.Stati.Annullato',
  RPT_SCADUTA: 'Ricevute.Stati.Scaduto',
};

/** Tono cromatico dello status-badge per gli stati RT noti. */
export const STATO_RT_COLOR: Record<StatoRt, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  RT_ACCETTATA_PA: 'success',
  RT_RIFIUTATA_PA: 'danger',
  RT_ESITO_SCONOSCIUTO_PA: 'warning',
  RPT_ATTIVATA: 'info',
  RPT_ACCETTATA_NODO: 'info',
  RPT_ACCETTATA_PSP: 'info',
  RPT_RIFIUTATA_NODO: 'danger',
  RPT_RIFIUTATA_PSP: 'danger',
  RPT_ERRORE_INVIO_A_PSP: 'danger',
  RPT_ANNULLATA: 'muted',
  RPT_SCADUTA: 'warning',
};

/** Label i18n dello stato con fallback allo stato grezzo. */
export function statoRtLabel(stato: string): string {
  return STATO_RT_LABEL[stato as StatoRt] ?? stato;
}

/** Tono dello stato con fallback neutro. */
export function statoRtColor(stato: string): 'success' | 'info' | 'warning' | 'danger' | 'muted' {
  return STATO_RT_COLOR[stato as StatoRt] ?? 'muted';
}
