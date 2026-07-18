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

// --- Schema "verboso" italiano (pagoPA ctRicevutaTelematica, versioneOggetto 6.x) ---

/** Identificativo univoco tipizzato dello schema verboso (`tipo` + `codice`). */
export interface RtIdUnivoco {
  tipoIdentificativoUnivoco?: string;
  codiceIdentificativoUnivoco?: string;
}

/** Soggetto pagatore (schema verboso). */
export interface RtSoggettoPagatore {
  identificativoUnivocoPagatore?: RtIdUnivoco;
  anagraficaPagatore?: string;
}

/** Istituto attestante = PSP (schema verboso). */
export interface RtIstitutoAttestante {
  identificativoUnivocoAttestante?: RtIdUnivoco;
  denominazioneAttestante?: string;
}

/** Ente beneficiario (schema verboso). */
export interface RtEnteBeneficiario {
  identificativoUnivocoBeneficiario?: RtIdUnivoco;
  denominazioneBeneficiario?: string;
  indirizzoBeneficiario?: string;
  civicoBeneficiario?: string;
  capBeneficiario?: string;
  localitaBeneficiario?: string;
  provinciaBeneficiario?: string;
  nazioneBeneficiario?: string;
}

/** Singolo pagamento nella RT verbosa. */
export interface RtDatiSingoloPagamento {
  singoloImportoPagato?: string;
  dataEsitoSingoloPagamento?: string;
  identificativoUnivocoRiscossione?: string;
  causaleVersamento?: string;
  datiSpecificiRiscossione?: string;
}

/** Singolo versamento nella RPT verbosa. */
export interface RptDatiSingoloVersamento {
  importoSingoloVersamento?: string;
  ibanAccredito?: string;
  causaleVersamento?: string;
  datiSpecificiRiscossione?: string;
}

/**
 * Conversione JSON della Ricevuta Telematica. Il backend può restituirla in due
 * forme: **flat inglese** (`paSendRT`) oppure **verbosa italiana**
 * (`ctRicevutaTelematica`, `versioneOggetto` 6.x). I campi di entrambe sono
 * opzionali; la normalizzazione (`normalizeRt`) le riconduce a una vista unica.
 */
export interface RtDettaglio {
  // flat (inglese)
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
  // verboso (italiano) — marcato da `versioneOggetto` (es. "6.2.0")
  versioneOggetto?: string;
  identificativoMessaggioRicevuta?: string;
  dataOraMessaggioRicevuta?: string;
  istitutoAttestante?: RtIstitutoAttestante;
  enteBeneficiario?: RtEnteBeneficiario;
  soggettoPagatore?: RtSoggettoPagatore;
  datiPagamento?: {
    codiceEsitoPagamento?: string;
    importoTotalePagato?: string;
    identificativoUnivocoVersamento?: string;
    datiSingoloPagamento?: RtDatiSingoloPagamento[];
  };
  [k: string]: unknown;
}

/** Conversione JSON della RPT (flat inglese o verbosa italiana). */
export interface RptDettaglio {
  // flat (inglese)
  creditorReferenceId?: string;
  paymentAmount?: string;
  dueDate?: string;
  lastPayment?: boolean;
  description?: string;
  companyName?: string;
  debtor?: RtSoggetto;
  transferList?: RtTransferList;
  // verboso (italiano) — marcato da `versioneOggetto` (es. "6.2.0")
  versioneOggetto?: string;
  enteBeneficiario?: RtEnteBeneficiario;
  soggettoPagatore?: RtSoggettoPagatore;
  datiVersamento?: {
    dataEsecuzionePagamento?: string;
    importoTotaleDaVersare?: string;
    tipoVersamento?: string;
    identificativoUnivocoVersamento?: string;
    datiSingoloVersamento?: RptDatiSingoloVersamento[];
  };
  [k: string]: unknown;
}

/** Riga trasferimento normalizzata (indipendente dallo schema). */
export interface RtTransferView {
  num?: string | number;
  importo?: string;
  iban?: string;
  causale?: string;
}

/** Vista RT normalizzata usata dal dettaglio (valori grezzi, formattati in UI). */
export interface RtView {
  esito?: string;
  importoPagato?: string;
  commissione?: string;
  metodoPagamento?: string;
  dataOraPagamento?: string;
  dataContabile?: string;
  dataTrasferimento?: string;
  receiptId?: string;
  numeroAvviso?: string;
  versanteNome?: string;
  versanteTipo?: string;
  versanteId?: string;
  versanteEmail?: string;
  enteNome?: string;
  enteCf?: string;
  iuv?: string;
  causale?: string;
  pspNome?: string;
  pspId?: string;
  pspCf?: string;
  canale?: string;
  transfers: RtTransferView[];
}

/** Vista RPT normalizzata. */
export interface RptView {
  importoRichiesto?: string;
  scadenza?: string;
  dataEsecuzione?: string;
  tipoVersamento?: string;
  ultimoPagamento?: boolean;
  iuv?: string;
  causale?: string;
}

/**
 * `true` se la RT è nel **formato verboso vecchio** (marcato da `versioneOggetto`;
 * fallback: presenza di `datiPagamento`), `false` se nel formato **flat nuovo**.
 */
function isVerboseRt(r: RtDettaglio): boolean {
  return r.versioneOggetto != null || r.datiPagamento != null;
}

/** `true` se la RPT è nel formato verboso vecchio. */
function isVerboseRpt(r: RptDettaglio): boolean {
  return r.versioneOggetto != null || r.datiVersamento != null;
}

/** Mapper RT formato flat (nuovo). */
function flatRt(r: RtDettaglio, codPsp?: string): RtView {
  const canale = [r.idChannel, r.channelDescription].filter(Boolean).join(' — ');
  return {
    esito: r.outcome,
    importoPagato: r.paymentAmount,
    commissione: r.fee,
    metodoPagamento: r.paymentMethod,
    dataOraPagamento: r.paymentDateTime,
    dataContabile: r.applicationDate,
    dataTrasferimento: r.transferDate,
    receiptId: r.receiptId,
    numeroAvviso: r.noticeNumber,
    versanteNome: r.debtor?.fullName,
    versanteTipo: r.debtor?.uniqueIdentifier?.entityUniqueIdentifierType,
    versanteId: r.debtor?.uniqueIdentifier?.entityUniqueIdentifierValue,
    versanteEmail: r.debtor?.['e-mail'],
    enteNome: r.companyName,
    enteCf: r.fiscalCode,
    iuv: r.creditorReferenceId,
    causale: r.description,
    pspNome: r.PSPCompanyName,
    pspId: r.idPSP ?? codPsp,
    pspCf: r.pspFiscalCode,
    canale: canale || undefined,
    transfers: (r.transferList?.transfer ?? []).map((t) => ({ num: t.idTransfer, importo: t.transferAmount, iban: t.IBAN, causale: t.remittanceInformation })),
  };
}

/**
 * Mapper RT formato verboso (vecchio). I trasferimenti verbosi non hanno IBAN:
 * viene recuperato per indice dai `datiSingoloVersamento` della RPT.
 */
function verboseRt(r: RtDettaglio, rpt?: RptDettaglio | null, codPsp?: string): RtView {
  const dp = r.datiPagamento;
  const sp = r.soggettoPagatore;
  const eb = r.enteBeneficiario;
  const ia = r.istitutoAttestante;
  const singRt = dp?.datiSingoloPagamento ?? [];
  const singRpt = rpt?.datiVersamento?.datiSingoloVersamento ?? [];
  return {
    esito: dp?.codiceEsitoPagamento === '0' ? 'OK' : dp?.codiceEsitoPagamento,
    importoPagato: dp?.importoTotalePagato,
    commissione: undefined,
    metodoPagamento: undefined,
    dataOraPagamento: r.dataOraMessaggioRicevuta,
    dataContabile: singRt[0]?.dataEsitoSingoloPagamento,
    dataTrasferimento: undefined,
    receiptId: r.identificativoMessaggioRicevuta,
    numeroAvviso: undefined,
    versanteNome: sp?.anagraficaPagatore,
    versanteTipo: sp?.identificativoUnivocoPagatore?.tipoIdentificativoUnivoco,
    versanteId: sp?.identificativoUnivocoPagatore?.codiceIdentificativoUnivoco,
    versanteEmail: undefined,
    enteNome: eb?.denominazioneBeneficiario,
    enteCf: eb?.identificativoUnivocoBeneficiario?.codiceIdentificativoUnivoco,
    iuv: dp?.identificativoUnivocoVersamento,
    causale: singRt[0]?.causaleVersamento,
    pspNome: ia?.denominazioneAttestante,
    pspId: codPsp,
    pspCf: ia?.identificativoUnivocoAttestante?.codiceIdentificativoUnivoco,
    canale: undefined,
    transfers: singRt.map((s, i) => ({ num: i + 1, importo: s.singoloImportoPagato, iban: singRpt[i]?.ibanAccredito, causale: s.causaleVersamento })),
  };
}

/** Normalizza la RT (flat nuovo o verboso vecchio) in una `RtView`. */
export function normalizeRt(rt?: RtDettaglio, rpt?: RptDettaglio | null, codPsp?: string): RtView {
  const r = rt ?? {};
  return isVerboseRt(r) ? verboseRt(r, rpt, codPsp) : flatRt(r, codPsp);
}

/** Normalizza la RPT (flat nuovo o verboso vecchio) in una `RptView`. */
export function normalizeRpt(rpt?: RptDettaglio | null): RptView {
  const r = rpt ?? {};
  if (!isVerboseRpt(r)) {
    return {
      importoRichiesto: r.paymentAmount,
      scadenza: r.dueDate,
      ultimoPagamento: r.lastPayment,
      iuv: r.creditorReferenceId,
      causale: r.description,
    };
  }
  const dv = r.datiVersamento;
  return {
    importoRichiesto: dv?.importoTotaleDaVersare,
    dataEsecuzione: dv?.dataEsecuzionePagamento,
    tipoVersamento: dv?.tipoVersamento,
    iuv: dv?.identificativoUnivocoVersamento,
    causale: dv?.datiSingoloVersamento?.[0]?.causaleVersamento,
  };
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
  /**
   * Viste normalizzate di RT/RPT (schema flat o verboso) valorizzate al confine
   * dell'API ({@link normalizeRt}/{@link normalizeRpt}) — non provengono dal
   * backend. Il dettaglio consuma queste invece di `rt`/`rpt` grezzi.
   */
  rtView?: RtView;
  rptView?: RptView;
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
