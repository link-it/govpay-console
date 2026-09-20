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
 * Rendering **dinamico best-effort** dei campi opachi di una voce pendenza.
 *
 * `contabilita`, `metadata` e `datiAllegati` sono dichiarati `type: string`
 * nello spec (`VocePendenza`): sono JSON serializzati la cui struttura interna
 * **non è formalizzata** ed è in parte specifica dell'ente/servizio. Questo
 * modulo li parsa in modo difensivo e li normalizza in gruppi visualizzabili
 * (vedi mockup dettaglio voci):
 * - **Dati aggiuntivi** — `dettaglio` tipizzato (IBAN/entrata/bollo) + `datiAllegati`;
 * - **Metadati del servizio** — coppie libere etichetta/valore da `metadata`;
 * - **Dati di contabilità** — array di dettagli tipizzati da `contabilita`,
 *   con importi in **eurocent** convertiti in euro per la visualizzazione.
 *
 * Nessun campo è cablato: chiavi note hanno un'etichetta i18n dedicata, le altre
 * sono rese con la chiave "prettificata". Ente-specifico → si raffina con dati reali.
 */

import { formatEuro, type InfoGridItem } from '@linkit/shared-ui';
import type { VoceDettaglio, VocePendenza } from './pendenza.model';

/** Una card di contabilità: badge del tipo (se presente) + coppie campo/valore. */
export interface VoceContabilitaCard {
  tipo?: string;
  items: InfoGridItem[];
}

/** Vista normalizzata dei tre gruppi espandibili di una voce. */
export interface VoceExtra {
  datiAggiuntivi: InfoGridItem[];
  metadati: InfoGridItem[];
  contabilita: VoceContabilitaCard[];
  isEmpty: boolean;
}

/* -------------------------------------------------------------------------- */
/* Parsing difensivo                                                          */
/* -------------------------------------------------------------------------- */

/** JSON.parse tollerante: stringa vuota/undefined → `undefined`; non-JSON → stringa grezza. */
export function parseJsonField(raw: unknown): unknown {
  if (raw == null) return undefined;
  if (typeof raw !== 'string') return raw;
  const t = raw.trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return raw;
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Chiave → parole leggibili (`annoEsercizio`/`ANNO_ESERCIZIO` → "Anno esercizio"). */
export function prettifyKey(key: string): string {
  const s = key
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}

/* -------------------------------------------------------------------------- */
/* Etichette note (i18n) e regole di formato                                  */
/* -------------------------------------------------------------------------- */

/** Mappa chiave-grezza (lowercase) → chiave i18n per le etichette note di contabilità. */
const CONTABILITA_LABEL_KEYS: Record<string, string> = {
  annoesercizio: 'Pendenze.Voci.AnnoContabile',
  annocontabile: 'Pendenze.Voci.AnnoContabile',
  anno: 'Pendenze.Voci.AnnoContabile',
  capitolo: 'Pendenze.Voci.Capitolo',
  accertamento: 'Pendenze.Voci.Accertamento',
  articolo: 'Pendenze.Voci.Articolo',
  codiceufficio: 'Pendenze.Voci.CodiceUfficio',
  importo: 'Pendenze.Voci.Importo',
  importonotifica: 'Pendenze.Voci.ImportoNotifica',
  tipoincasso: 'Pendenze.Voci.TipoIncasso',
  codicecontabilita: 'Pendenze.Voci.CodiceContabilita',
  codicetributo: 'Pendenze.Voci.CodiceTributo',
  codtributo: 'Pendenze.Voci.CodiceTributo',
  codiceinformazione: 'Pendenze.Voci.CodiceInformazione',
  ibanaccredito: 'Pendenze.Voci.IbanAccredito',
};

/** Chiavi che identificano il "tipo" di una quota di contabilità (rese come badge, non come riga). */
const TIPO_KEYS = ['tipocontabilizzazione', 'tipo', 'tipocontabilita', 'tipoquota'];

/** Chiavi il cui valore è un importo in eurocent (→ diviso 100 e formattato in euro). */
const AMOUNT_KEY_RE = /import/i;
/** Chiavi tecniche da non mostrare come riga. */
const HIDDEN_KEY_RE = /^(id|proprietacustom)$/i;

/** Etichetta per una chiave di contabilità: i18n se nota, altrimenti prettificata. */
function labelForKey(key: string): string {
  return CONTABILITA_LABEL_KEYS[key.toLowerCase()] ?? prettifyKey(key);
}

/** Valore formattato per la vista; `eurocent` converte gli importi in euro. */
function formatValue(key: string, value: unknown, eurocent: boolean): string {
  if (value == null || value === '') return '—';
  if (isPlainObject(value) || Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Sì' : 'No';
  if (eurocent && AMOUNT_KEY_RE.test(key)) {
    const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    if (Number.isFinite(n)) return formatEuro(n / 100);
  }
  return String(value);
}

/** `true` se la chiave/valore vanno mostrati come coppia (scarta tecniche e vuoti). */
function isMono(key: string): boolean {
  return /iban|codice|cod|id|hash|capitolo|accertamento|articolo/i.test(key);
}

/* -------------------------------------------------------------------------- */
/* Normalizzatori                                                             */
/* -------------------------------------------------------------------------- */

/** Coppie libere (metadati del servizio): oggetto chiave/valore o array di {chiave,valore}. */
export function normalizeMetadata(raw: unknown): InfoGridItem[] {
  const data = parseJsonField(raw);
  if (data == null) return [];
  const items: InfoGridItem[] = [];
  if (Array.isArray(data)) {
    for (const el of data) {
      if (!isPlainObject(el)) continue;
      const label = (el['chiave'] ?? el['key'] ?? el['nome'] ?? el['label']) as string | undefined;
      const value = el['valore'] ?? el['value'] ?? el['val'];
      if (label != null) items.push({ labelKey: String(label), value: formatValue(String(label), value, false) });
    }
  } else if (isPlainObject(data)) {
    for (const [k, v] of Object.entries(data)) {
      if (HIDDEN_KEY_RE.test(k)) continue;
      items.push({ labelKey: k, value: formatValue(k, v, false), mono: isMono(k) });
    }
  }
  return items.filter((i) => i.value !== '—');
}

/** Estrae l'array di quote da varie forme (`[...]`, `{quote:[...]}`, singolo oggetto). */
function extractContabilitaArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter(isPlainObject) as Record<string, unknown>[];
  if (isPlainObject(data)) {
    for (const key of ['quote', 'dettagli', 'quota', 'contabilita', 'items', 'righe']) {
      const arr = data[key];
      if (Array.isArray(arr)) return arr.filter(isPlainObject) as Record<string, unknown>[];
    }
    return [data];
  }
  return [];
}

/** Estrae il "tipo" (badge) di una quota, se presente. */
function extractTipo(item: Record<string, unknown>): string | undefined {
  for (const k of Object.keys(item)) {
    if (TIPO_KEYS.includes(k.toLowerCase()) && item[k] != null) return String(item[k]);
  }
  return undefined;
}

/** Dati di contabilità → card tipizzate; importi in eurocent → euro. */
export function normalizeContabilita(raw: unknown): VoceContabilitaCard[] {
  const data = parseJsonField(raw);
  if (data == null) return [];
  const arr = extractContabilitaArray(data);
  const cards: VoceContabilitaCard[] = [];
  for (const item of arr) {
    const tipo = extractTipo(item);
    const items: InfoGridItem[] = [];
    for (const [k, v] of Object.entries(item)) {
      if (TIPO_KEYS.includes(k.toLowerCase()) || HIDDEN_KEY_RE.test(k)) continue;
      const value = formatValue(k, v, true);
      if (value === '—') continue;
      items.push({ labelKey: labelForKey(k), value, mono: isMono(k) });
    }
    if (tipo || items.length) cards.push({ tipo, items });
  }
  return cards;
}

/**
 * Campi "dati aggiuntivi" derivati dal `dettaglio` tipizzato. Per l'incasso
 * diretto sono solo gli IBAN (accredito sempre, appoggio solo se valorizzato —
 * è raro, non deve diventare una colonna fissa); tipo/codice contabilità NON
 * vanno qui (appartengono alla sezione "Dati di contabilità").
 */
function dettaglioItems(d: VoceDettaglio | undefined): InfoGridItem[] {
  if (!d) return [];
  switch (d.tipoVoce) {
    case 'ENTRATA_ANAGRAFICA':
      return [{ labelKey: 'Pendenze.Voci.CodEntrata', value: d.codEntrata, mono: true }];
    case 'INCASSO_DIRETTO':
      return [
        { labelKey: 'Pendenze.Voci.IbanAccredito', value: d.ibanAccredito, mono: true },
        { labelKey: 'Pendenze.Voci.IbanAppoggio', value: d.ibanAppoggio, mono: true, hide: !d.ibanAppoggio },
      ];
    case 'BOLLO_TELEMATICO':
      return [
        { labelKey: 'Pendenze.Voci.TipoBollo', value: d.tipoBollo },
        { labelKey: 'Pendenze.Voci.ProvinciaResidenza', value: d.provinciaResidenza },
        { labelKey: 'Pendenze.Voci.HashDocumento', value: d.hashDocumento, mono: true, wide: true },
      ];
  }
}

/** Costruisce la vista completa dei gruppi espandibili di una voce. */
export function voceExtra(v: VocePendenza): VoceExtra {
  const datiAggiuntivi = [...dettaglioItems(v.dettaglio), ...normalizeMetadata(v.datiAllegati)];
  const metadati = normalizeMetadata(v.metadata);
  const contabilita = normalizeContabilita(v.contabilita);
  return {
    datiAggiuntivi,
    metadati,
    contabilita,
    isEmpty: datiAggiuntivi.length === 0 && metadati.length === 0 && contabilita.length === 0,
  };
}
