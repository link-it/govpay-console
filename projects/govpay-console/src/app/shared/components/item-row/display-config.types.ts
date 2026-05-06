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
 * Modello di configurazione condiviso da `lnk-item-type`, `lnk-item-row`
 * e (opzionalmente) `lnk-data-table`. Adattato dal pattern GovHub
 * `core/ui/item-row` / `core/ui/item-type`.
 *
 * Il modello è "data-driven": ogni `ItemTypeElement` descrive UN campo
 * della riga (cosa leggere, come renderizzarlo) e i tipi di `options`
 * forniscono la mappa `valore-grezzo` → `{ label, background, color, … }`.
 */

/** Tutti i tipi di rendering supportati da `<lnk-item-type>`. */
export type ItemTypeKind =
  | 'text'
  | 'html'
  | 'markdown'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'mstime'
  | 'timeago'
  | 'message'
  | 'label'
  | 'simplelabel'
  | 'status'
  | 'tag'
  | 'tags'
  | 'cardinal'
  | 'progress'
  | 'icon'
  | 'iconBs'
  | 'icontext'
  | 'image'
  | 'avatar-image'
  | 'labelI18n';

/** Posizioni tooltip supportate. */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'above' | 'below';

/** Singolo elemento renderizzato da `<lnk-item-type>`. */
export interface ItemTypeElement {
  /** Tipo di rendering. */
  type: ItemTypeKind;
  /** Path dot-notated del valore nel data row (`'soggettoPagatore.anagrafica'`). */
  field?: string;
  /** Etichetta (chiave i18n) — usata da label/status. */
  label?: string;
  /** Nome del gruppo `options` su cui mappare il valore (status/label/tag/icon). */
  options?: string;
  /** Valore di default se il path è vuoto/undefined. */
  default?: string;
  /** Nome icona (per type=`icon`/`iconBs`). */
  icon?: string;
  /** Classi Tailwind opzionali da applicare al wrapper. */
  class?: string;
  /** Tooltip statico (chiave i18n) o oggetto descrittore. */
  tooltip?: string | TooltipDescriptor;
  /** Placement tooltip (default `top`). */
  tooltipPlacement?: TooltipPlacement;
  /** Hide tooltip anche se l'option lo definisce. */
  hideTooltip?: boolean;
  /** Per type=`text`: numero massimo caratteri (con `…`). */
  truncate?: number;
  /**
   * Per type=`text`: prefisso i18n per tradurre i valori enum-like.
   *
   * Quando set, il valore raw viene risolto come chiave i18n
   * `${i18nPrefix}.${rawValue}` e tradotto. Se la chiave non esiste, il
   * raw value viene usato come fallback (no-op).
   *
   * Esempio:
   *   ```json
   *   { "type": "text", "field": "componente",
   *     "i18nPrefix": "GiornaleEventi.Componenti" }
   *   ```
   *   con `componente: "API_BACKOFFICE"` e i18n
   *   `GiornaleEventi.Componenti.API_BACKOFFICE: "API Backoffice"` →
   *   render "API Backoffice". Senza i18n match → render "API_BACKOFFICE".
   */
  i18nPrefix?: string;
  /**
   * Per type=`text`: nome di un altro field della riga il cui valore va
   * inserito nel path della chiave i18n tra `i18nPrefix` e il valore
   * raw. Utile per dizionari nested per scope (es. `tipoEvento` mappato
   * sotto il `componente` di appartenenza, allineato al legacy
   * `GovApiTipiEvento`).
   *
   * Esempio:
   *   ```json
   *   { "type": "text", "field": "tipoEvento",
   *     "i18nPrefix": "GiornaleEventi.Tipi",
   *     "i18nPrefixField": "componente" }
   *   ```
   *   con `componente: "API_BACKOFFICE"` e `tipoEvento: "findPendenze"`
   *   → chiave `GiornaleEventi.Tipi.API_BACKOFFICE.findPendenze` →
   *   render "Cerca pendenze".
   */
  i18nPrefixField?: string;
  /** Per type=`avatar-image`/`image`: forma quadrata invece di tonda. */
  square?: boolean;
  /** Per type=`image`: object-fit (`contain` | `cover`). */
  mode?: 'contain' | 'cover';
  /** Per avatar-image: campo da cui prendere le iniziali fallback. */
  alt?: string;
  /** Per number: nasconde se 0. */
  hideZero?: boolean;
  /** Hide se valore vuoto/null. */
  hideEmpty?: boolean;
  /** Forza prefix con la chiave label (`Label: value`). */
  showLabel?: boolean;
  /** Append un secondo valore originale. */
  appendValue?: string;
  /** Aggiunge spazio bianco / separator dopo il valore. */
  emptySpace?: boolean;
  /** Se true il rendering avvolge in un block-level invece che inline. */
  blockSpace?: boolean;
  /**
   * Se true sopprime il separatore (`·`) inserito automaticamente da
   * `<lnk-item-row>` PRIMA di questo item. Utile per agganciare un valore
   * direttamente dopo una `simplelabel` (es. `IUV: 12345`) senza puntino
   * intermedio.
   */
  noSeparator?: boolean;
  /**
   * Marca questo elemento come trigger del click sulla riga. Letto da
   * `<lnk-data-table>` (via `columnsFromConfig`) per renderizzare la
   * cella come link e da `<lnk-item-row>` per scegliere automaticamente
   * la sezione cliccabile.
   */
  link?: boolean;
}

export interface TooltipDescriptor {
  field: string;
  options?: string;
  label?: string;
  type?: 'mstime' | 'text';
  placement?: TooltipPlacement;
}

/** Box di stato compatto (sx/dx) della riga. */
export interface BoxStatusConfig {
  primaryText?: ItemTypeElement[];
  metadata?: ItemTypeElement[];
  /** Background statico o dinamico (`{ field, options }`). */
  background?: string | { field: string; options: string };
  color?: string;
  tooltip?: string | TooltipDescriptor;
}

export interface ItemRowFooterConfig {
  primaryText?: ItemTypeElement[];
  secondaryText?: ItemTypeElement[];
}

/** Sezione di `<lnk-item-row>` che funge da "link" cliccabile. */
export type ItemRowLinkSection =
  | 'primaryText'
  | 'secondaryText'
  | 'avatar'
  | 'none';

/**
 * Configurazione di una singola variante di riga. Una `DisplayConfig`
 * tipicamente espone `itemRow`, ma può avere varianti aggiuntive
 * (es. `simpleItem`) selezionabili dal chiamante.
 */
export interface ItemRowConfig {
  /** Avatar a sinistra (1 elemento). */
  avatar?: ItemTypeElement;
  /** Riga primaria — titolo dell'item (es. IUV). */
  primaryText?: ItemTypeElement[];
  /** Metadati sotto la riga primaria. */
  metadata?: { text: ItemTypeElement[]; label: ItemTypeElement[] };
  /** Colonna a destra: testo principale. */
  secondaryText?: ItemTypeElement[];
  /** Colonna a destra: metadati secondari. */
  secondaryMetadata?: ItemTypeElement[];
  /** Box di stato (es. importo + valuta). */
  boxStatus1?: BoxStatusConfig;
  /** Box di stato secondario (es. esito). */
  boxStatus2?: BoxStatusConfig;
  /** Footer in alto (linea separata). */
  topfooter?: ItemRowFooterConfig[];
  /** Footer in basso (linea separata). */
  footer?: ItemRowFooterConfig;
  /**
   * Sezione cliccabile della riga. Default `'primaryText'`.
   * - `'none'`: nessun click sulla riga.
   * - in alternativa, marcare `link: true` su un singolo `ItemTypeElement`
   *   per spostare il trigger su quell'elemento (override automatico).
   */
  linkSection?: ItemRowLinkSection;
}

/**
 * Configurazione di una singola colonna di `<lnk-data-table>` driven-by-config.
 * Il rendering della cella è delegato a `<lnk-item-type>` tramite `cell`,
 * così tabella e item-row condividono lo stesso modello (text/date/currency/
 * status/badge/tag/icon/…) e la stessa mappa `options`.
 */
export interface TableColumnConfig {
  /** Identificatore colonna (per `sortChange.key` e tracking). Default: `cell.field`. */
  key?: string;
  /** Chiave i18n dell'header. */
  header: string;
  /** Descrittore di rendering della cella (stesso modello di `<lnk-item-type>`). */
  cell: ItemTypeElement;
  /** Larghezza CSS opzionale. */
  width?: string;
  /** Allineamento orizzontale. */
  align?: 'left' | 'center' | 'right';
  /** La colonna emette `sortChange` al click sull'header. */
  sortable?: boolean;
  /** Classi extra per l'header. */
  headerClass?: string;
  /** Classi extra per la cella (es. `font-mono text-xs`). */
  cellClass?: string;
  /**
   * Se `true` solo questa cella riceve il click (cursor pointer +
   * hover evidenziato). Equivale a `cell.link: true`. Se nessuna
   * colonna ha `link`, l'intera riga è cliccabile.
   */
  link?: boolean;
}

/** Sezione `table` della `DisplayConfig`: definizione delle colonne. */
export interface TableConfig {
  columns: TableColumnConfig[];
}

/**
 * Mappa di gruppi di opzioni: `STATI_PENDENZA → { values: { ESEGUITA: { label, background, color }, … } }`.
 * Usata dai tipi `status`, `label`, `tag`, `icon` per risolvere stile/label dal valore grezzo.
 */
export interface DisplayOptionsMap {
  [groupName: string]: {
    label?: string;
    small?: boolean;
    values: {
      [rawValue: string]: {
        label?: string;
        icon?: string;
        background?: string;
        color?: string;
        border?: string;
        tooltip?: string;
        tooltip2?: string;
        tooltipPlacement?: TooltipPlacement;
      };
    };
  };
}

/**
 * Configurazione completa della vista lista. Accettata sia da
 * `lnk-item-list` (rows + config) sia, in futuro, da `lnk-data-table`
 * via input opzionale `displayConfig` per richiamare le stesse `options`.
 */
export interface DisplayConfig {
  /** Variante di default usata da `lnk-item-row`. */
  itemRow?: ItemRowConfig;
  /** Variante alternativa "compact". */
  simpleItem?: ItemRowConfig;
  /** Definizione colonne per `<lnk-data-table>` driven-by-config. */
  table?: TableConfig;
  /** Mappa dei gruppi di option (stati, label, tag, icone, …). */
  options?: DisplayOptionsMap;
  /** Eventuali altre varianti accessibili tramite `configRow=`. */
  [key: string]: ItemRowConfig | TableConfig | DisplayOptionsMap | undefined;
}
