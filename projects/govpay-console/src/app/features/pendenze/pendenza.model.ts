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
 * Modelli **Pendenza V2** allineati alla GovPay Console API
 * (`GET /govpay-console-api/pendenze…`, schema OpenAPI in
 * `NOTE-CLAUDE/REFACTORING-NUOVE-API-PENDENZE/openapi.yaml`).
 *
 * Modello canonico della feature Pendenze (cutover su console-api V2 completato
 * in Fase 5; rimossi il modello V1 e `pendenze.api.ts`, i tipi condivisi
 * `DominioSummary`/`SoggettoPagatore` promossi in `@core/models`).
 *
 * Differenze chiave rispetto al V1:
 * - enum stati rinominati (`PAGATA`/`NON_PAGATA`/… al posto di `ESEGUITA`/…);
 * - `soggettoPagatore` NON è nel body → sub-resource `/informazioniDebitore`;
 * - `voci` sempre inline (1–5); navigazione sub-resources via `_links` (HAL);
 * - niente `iuv`/`dataCaricamento`; ordinamento su `dataUltimoAggiornamento`.
 */

import type { PaginationParams } from '@core/models';

/* =========================================================================
 * Enum
 * ========================================================================= */

/**
 * Stato della pendenza (schema `StatoPendenza`). Mapping V1→V2:
 * `ESEGUITA→PAGATA`, `NON_ESEGUITA→NON_PAGATA`,
 * `ESEGUITA_PARZIALE→PAGATA_PARZIALE`, `INCASSATA→RICONCILIATA`;
 * `ANNULLATA`/`SCADUTA`/`ANOMALA` invariati.
 */
export type StatoPendenza =
  | 'NON_PAGATA'
  | 'PAGATA'
  | 'PAGATA_PARZIALE'
  | 'ANNULLATA'
  | 'SCADUTA'
  | 'RICONCILIATA'
  | 'ANOMALA';

/** Stato di una singola voce (schema `StatoVocePendenza`). */
export type StatoVocePendenza = 'NON_PAGATA' | 'PAGATA' | 'ANOMALA';

/** Stato dell'avviso di pagamento (schema `StatoAvviso`). */
export type StatoAvviso = 'PAGATO' | 'NON_PAGATO' | 'SCADUTO' | 'ANNULLATO';

/**
 * Lingua secondaria per la stampa bilingue dell'avviso (schema
 * `LinguaSecondaria`). `NONE` forza solo italiano (ex V1 `FALSE`).
 */
export type LinguaSecondaria = 'DE' | 'EN' | 'FR' | 'SL' | 'NONE';

/** Tipo di contabilità di una voce a incasso diretto (schema `TipoContabilita`). */
export type TipoContabilita =
  | 'CAPITOLO'
  | 'SPECIALE'
  | 'SIOPE'
  | 'SRTP_ESCLUSA_RAVV_OPEROSO'
  | 'SRTP_ESCLUSA_ALTRO_OPERATORE'
  | 'SRTP_ESCLUSA'
  | 'ALTRO';

/** Sotto-tree opt-in del dettaglio pendenza via `?expand=` (schema `PendenzaExpand`). */
export type PendenzaExpand = 'datiAllegati' | 'proprieta';

/* =========================================================================
 * Riferimenti anagrafici + HAL
 * ========================================================================= */

export interface DominioRef {
  idDominio: string;
  ragioneSociale: string;
}

export interface TipoPendenzaRef {
  idTipoPendenza: string;
  descrizione: string;
}

export interface UnitaOperativaRef {
  idUnitaOperativa: string;
  ragioneSociale: string;
}

/** Hyperlink stile HAL (schema `Link`). */
export interface Link {
  href: string;
  type?: string;
}

/**
 * Collezione di `_links` della pendenza (schema `PendenzaLinks`).
 * `informazioniDebitore` e `ricevute` sono **sempre** presenti; `avviso` è
 * condizionale (solo se `numeroAvviso != null`). `additionalProperties` per
 * chiavi future (rpp, pagamenti, allegati…).
 */
export interface PendenzaLinks {
  informazioniDebitore: Link;
  ricevute: Link;
  avviso?: Link;
  [rel: string]: Link | undefined;
}

/* =========================================================================
 * Voci (embedded inline nel dettaglio, max 5)
 * ========================================================================= */

/** Voce che referenzia una entrata configurata in anagrafica (`ENTRATA_ANAGRAFICA`). */
export interface VocePendenzaEntrataAnagrafica {
  tipoVoce: 'ENTRATA_ANAGRAFICA';
  codEntrata: string;
}

/** Voce con dati di incasso espliciti (`INCASSO_DIRETTO`). */
export interface VocePendenzaIncassoDiretto {
  tipoVoce: 'INCASSO_DIRETTO';
  ibanAccredito: string;
  ibanAppoggio?: string;
  tipoContabilita: TipoContabilita;
  codiceContabilita: string;
}

/** Voce di bollo telematico / marca da bollo digitale (`BOLLO_TELEMATICO`). */
export interface VocePendenzaBolloTelematico {
  tipoVoce: 'BOLLO_TELEMATICO';
  tipoBollo: 'Imposta di bollo';
  hashDocumento: string;
  /** Sigla automobilistica della provincia di residenza (2 lettere maiuscole). */
  provinciaResidenza: string;
}

/** Unione discriminata su `tipoVoce` del dettaglio di una voce. */
export type VoceDettaglio =
  | VocePendenzaEntrataAnagrafica
  | VocePendenzaIncassoDiretto
  | VocePendenzaBolloTelematico;

/**
 * Voce di una pendenza (schema `VocePendenza`), embedded inline (max 5).
 * Per la visualizzazione base bastano `indice`/`descrizione`/`importo`/`stato`.
 */
export interface VocePendenza {
  idVocePendenza: string;
  indice?: number;
  importo: number;
  descrizione: string;
  stato: StatoVocePendenza;
  descrizioneCausaleRPT?: string;
  contabilita?: string;
  datiAllegati?: string;
  metadata?: string;
  /** Dominio della singola voce (multibeneficiario). `null` → vale quello della pendenza. */
  dominio?: DominioRef | null;
  dettaglio?: VoceDettaglio;
}

/* =========================================================================
 * Pendenza: summary (lista) + detail
 * ========================================================================= */

/**
 * Proiezione leggera per le liste paginate (schema `PendenzaSummary`).
 * **Non** espone dati del debitore (vedi `/informazioniDebitore`).
 */
export interface PendenzaSummary {
  idA2A: string;
  idPendenza: string;
  stato: StatoPendenza;
  dominio: DominioRef;
  tipoPendenza: TipoPendenzaRef;
  /** `null`/assente per pendenze non assegnate a una unità operativa. */
  unitaOperativa?: UnitaOperativaRef | null;
  importo: number;
  /** 18 cifre. Assente per pendenze spontanee non ancora avvisate. */
  numeroAvviso?: string;
  iuvAvviso?: string;
  causale: string;
  /** ISO date-time. */
  dataScadenza?: string;
  /** ISO date (`YYYY-MM-DD`). */
  dataValidita?: string;
  /** ISO date-time — campo di ordinamento di default (`-dataUltimoAggiornamento`). */
  dataUltimoAggiornamento: string;
  dataUltimaModificaAca?: string;
  dataUltimaComunicazioneAca?: string;
}

/**
 * Dettaglio canonico della pendenza (schema `Pendenza`):
 * `PendenzaSummary` + campi propri + `voci` inline + `_links` + sotto-tree
 * opt-in (`datiAllegati`/`proprieta`, solo con `?expand=`).
 * `soggettoPagatore` **non** è presente: si carica da `/informazioniDebitore`.
 */
export interface Pendenza extends PendenzaSummary {
  descrizione?: string;
  documento?: string;
  direzione?: string;
  divisione?: string;
  /** Sempre presente, 1–5 elementi. */
  voci: VocePendenza[];
  /** Solo con `?expand=datiAllegati`. */
  datiAllegati?: string;
  /** Solo con `?expand=proprieta`. */
  proprieta?: string;
  _links: PendenzaLinks;
}

/* =========================================================================
 * Sub-resources
 * ========================================================================= */

/** Metadati locali dell'avviso (variante `application/json` di `/avviso`, schema `Avviso`). */
export interface Avviso {
  idDominio: string;
  numeroAvviso: string;
  importo: number;
  descrizione?: string;
  dataValidita?: string;
  dataScadenza?: string;
  tassonomiaAvviso?: string;
  qrcode?: string;
  barcode?: string;
  stato: StatoAvviso;
}

/**
 * Proiezione leggera di una ricevuta telematica (schema `RicevutaSummary`),
 * elemento della lista `GET …/ricevute`. `(idDominio, iuv, ccp)` identificano
 * la RT per la futura navigazione ai sub-resource XML/PDF (fuori questa spec).
 */
export interface RicevutaSummary {
  idDominio: string;
  iuv: string;
  ccp: string;
  dataPagamento?: string;
  importoTotalePagato?: number;
  /** Codice esito pagoPA (0 = Eseguito, 2 = Parzialmente eseguito). */
  esito?: number;
  idPsp?: string;
}

/** Anagrafica e contatti del debitore (schema `Soggetto`, via `/informazioniDebitore`). */
export interface Soggetto {
  /** `F` persona fisica, `G` persona giuridica. */
  tipo: 'F' | 'G';
  identificativo: string;
  anagrafica: string;
  indirizzo?: string;
  civico?: string;
  cap?: string;
  localita?: string;
  provincia?: string;
  /** Codice ISO 3166-1 alpha-2. */
  nazione?: string;
  email?: string;
  cellulare?: string;
}

/* =========================================================================
 * Filtri di lista (query params di `GET /pendenze`)
 * ========================================================================= */

/**
 * Filtri della lista pendenze (Fase 1 API): solo i 4 supportati, tutti opzionali
 * e in AND. Estende {@link PaginationParams} (`page`/`limit`/`sort`/`total`/`cursor`).
 * I filtri V1 (`stato`, `dataDa`, `dataA`, `iuv`, `tipoPendenza`, …) → **400**.
 */
export interface PendenzeListFilters extends PaginationParams {
  /** Match parziale sull'identificativo pendenza. */
  idPendenza?: string;
  /** Numero avviso pagoPA, match esatto (`^[0-9]{18}$`). */
  numeroAvviso?: string;
  /** Codice dominio, match esatto (`^[0-9]{11}$`). */
  idDominio?: string;
  /** CF/PIVA del debitore, match esatto. ⚠️ genera audit GDPR lato API. */
  identificativoDebitore?: string;
}

/* =========================================================================
 * Mappe di presentazione (label i18n + tono badge)
 * ========================================================================= */

/**
 * Stato pendenza → chiave i18n. Chiavi allineate all'enum V2 (§6.2): vanno
 * aggiunte a `i18n-domain/{it,en}.json` → `Pendenze.Stati.*` in Fase 5.
 */
export const STATO_PENDENZA_LABEL: Record<StatoPendenza, string> = {
  NON_PAGATA: 'Pendenze.Stati.NonPagata',
  PAGATA: 'Pendenze.Stati.Pagata',
  PAGATA_PARZIALE: 'Pendenze.Stati.PagataParziale',
  ANNULLATA: 'Pendenze.Stati.Annullata',
  SCADUTA: 'Pendenze.Stati.Scaduta',
  RICONCILIATA: 'Pendenze.Stati.Riconciliata',
  ANOMALA: 'Pendenze.Stati.Anomala',
};

/** Tono cromatico del badge per stato pendenza. */
export const STATO_PENDENZA_COLOR: Record<StatoPendenza, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  PAGATA: 'success',
  RICONCILIATA: 'success',
  PAGATA_PARZIALE: 'info',
  NON_PAGATA: 'info',
  SCADUTA: 'warning',
  ANNULLATA: 'muted',
  ANOMALA: 'danger',
};

/** Stato voce → chiave i18n (`Pendenze.StatiVoce.*`, da aggiungere in Fase 5). */
export const STATO_VOCE_PENDENZA_LABEL: Record<StatoVocePendenza, string> = {
  NON_PAGATA: 'Pendenze.StatiVoce.NonPagata',
  PAGATA: 'Pendenze.StatiVoce.Pagata',
  ANOMALA: 'Pendenze.StatiVoce.Anomala',
};

/** Tono cromatico del badge per stato voce. */
export const STATO_VOCE_PENDENZA_COLOR: Record<StatoVocePendenza, 'success' | 'info' | 'danger'> = {
  PAGATA: 'success',
  NON_PAGATA: 'info',
  ANOMALA: 'danger',
};

/** Stato avviso → chiave i18n (`Pendenze.StatiAvviso.*`, da aggiungere in Fase 5). */
export const STATO_AVVISO_LABEL: Record<StatoAvviso, string> = {
  PAGATO: 'Pendenze.StatiAvviso.Pagato',
  NON_PAGATO: 'Pendenze.StatiAvviso.NonPagato',
  SCADUTO: 'Pendenze.StatiAvviso.Scaduto',
  ANNULLATO: 'Pendenze.StatiAvviso.Annullato',
};
