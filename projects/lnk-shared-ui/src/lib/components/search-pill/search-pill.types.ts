/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Contratti dati pubblici di `<lnk-search-pill>`.
 *
 * Il componente è interamente **config-driven**: si descrive il form filtri con
 * un array di `SearchField` e il componente renderizza la barra a pillola, il
 * popover filtri, i chip attivi, l'autocomplete e il toggle di ordinamento. Lo
 * stesso componente serve quindi qualsiasi contesto (Pendenze, Soggetti, …).
 */

/** Nome icona `@ng-icons` (es. `bootstrapBuilding`). Registrata dall'app host. */
export type IconName = string;

/**
 * Tipi di campo. `select` con poche opzioni si auto-renderizza come segmented;
 * `date` rende un `<input type="date">` (valore ISO `YYYY-MM-DD`).
 */
export type SearchFieldKind = 'text' | 'select' | 'date';

/** Un controllo filtro del popover. */
export interface SearchField {
  /** Chiave univoca — usata come chiave in `SearchState.filters`. */
  id: string;
  /** Label (maiuscoletto) sopra il controllo. */
  label: string;
  kind: SearchFieldKind;
  /** Glifo contestuale opzionale accanto alla label (nome icona ng-icons). */
  icon?: IconName;
  /** Placeholder per i campi `text` e i `select` vuoti. */
  placeholder?: string;
  /** Opzioni per i `select`. Usa '' come opzione "qualsiasi / nessuna". */
  options?: string[];
  /**
   * Etichette visuali per le `options` (mappa valore → label). Permette di
   * tradurre l'etichetta mantenendo stabile il valore memorizzato/inviato.
   * Se un'opzione non è presente nella mappa, si mostra il valore stesso.
   */
  optionLabels?: Record<string, string>;
  /**
   * Valore di default (non filtrato). Un campo il cui valore corrente è uguale
   * al default NON produce un chip attivo. Default comuni: '' o 'Tutti'.
   */
  default?: string;
  /** Span nel popover: 1 (mezza larghezza) o 2 (piena). */
  span?: 1 | 2;
  /**
   * Un `select` con `<= segmentedMax` opzioni non vuote si renderizza come
   * segmented control inline invece che dropdown. Default 4. 0 forza il dropdown.
   */
  segmentedMax?: number;
  /** Abilita il filtro opzioni nel dropdown oltre questa soglia. Default 6. */
  searchableFrom?: number;
  /** Solo `kind: 'date'`: limite inferiore (`YYYY-MM-DD`) del date picker. */
  min?: string;
  /** Solo `kind: 'date'`: limite superiore (`YYYY-MM-DD`) del date picker. */
  max?: string;
}

/** Un'opzione di ordinamento del toggle/menu sort. */
export interface SortOption {
  id: string;
  label: string;
}

export type SortDir = 'asc' | 'desc';

/** Riga di suggerimento dell'autocomplete. */
export interface Suggestion {
  /** Bucket di raggruppamento — guida l'intestazione di sezione nel dropdown. */
  kind: 'recent' | 'saved' | 'suggest';
  label: string;
  /** Testo meta allineato a destra (es. "Recente · 2 min fa"). */
  meta?: string;
  icon?: IconName;
}

/** Label dei gruppi di suggerimenti (override per relabel/i18n). */
export interface SuggestionGroupLabels {
  recent: string;
  saved: string;
  suggest: string;
}

/** Lo stato completo a due vie della barra di ricerca. */
export interface SearchState {
  /** Query di testo libero digitata nella pillola. */
  query: string;
  /** Mappa id campo → valore corrente. */
  filters: Record<string, string>;
  /** Id opzione di ordinamento attiva. */
  sort: string;
  /** Direzione di ordinamento. */
  dir: SortDir;
}

/** Un chip di filtro attivo derivato da `SearchState.filters`. */
export interface ActiveChip {
  id: string;
  label: string;
  value: string;
}

export type Density = 'compact' | 'regular' | 'comfortable';

/** Label usate nel componente — centralizzate per i18n. */
export interface SearchPillLabels {
  filters: string;
  reset: string;
  close: string;
  search: string;
  activeSuffix: string;
  resultsApproxPrefix: string;
  resultsSuffix: string;
  noResults: string;
  optionsFilter: string;
  none: string;
  /** Menu dropdown senza opzioni corrispondenti. */
  noOptions: string;
  /** Placeholder di default per i campi `text` (se il field non ne definisce uno). */
  textPlaceholder: string;
  /** Placeholder di default per i campi `select` (se il field non ne definisce uno). */
  selectPlaceholder: string;
  /** Testo del footer quando non è disponibile un conteggio risultati. */
  allFieldsHint: string;
}

export const DEFAULT_LABELS: SearchPillLabels = {
  filters: 'Filtri',
  reset: 'Reimposta',
  close: 'Chiudi',
  search: 'Cerca',
  activeSuffix: 'attivi',
  resultsApproxPrefix: '≈',
  resultsSuffix: 'risultati',
  noResults: 'Nessun risultato',
  optionsFilter: 'Filtra opzioni…',
  none: '— Nessuno —',
  noOptions: 'Nessuna opzione',
  textPlaceholder: 'Digita per cercare…',
  selectPlaceholder: 'Seleziona…',
  allFieldsHint: 'I filtri si applicano a tutti i campi',
};

export const DEFAULT_SUGGESTION_GROUP_LABELS: SuggestionGroupLabels = {
  recent: 'Recenti',
  saved: 'Salvate',
  suggest: 'Suggerimenti',
};

/**
 * Costruisce uno `SearchState` iniziale da una config di campi, seminando ogni
 * filtro col suo default. Comodo per l'init del binding `[(value)]`.
 */
export function initialSearchState(
  fields: SearchField[],
  sort = '',
  dir: SortDir = 'desc',
): SearchState {
  const filters: Record<string, string> = {};
  for (const f of fields) {
    if (f.id === 'query') continue;
    filters[f.id] = f.default ?? '';
  }
  return { query: '', filters, sort, dir };
}

/**
 * Calcola i chip attivi (campi il cui valore differisce dal default).
 * Include sia i `select` sia i `text`, così ogni filtro valorizzato è visibile
 * come chip nella barra. Esclude la `query` di testo libero (id `query`), che
 * è già mostrata nell'input della pillola.
 */
export function computeActiveChips(
  fields: SearchField[],
  filters: Record<string, string>,
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const f of fields) {
    if (f.id === 'query') continue;
    const value = filters[f.id];
    const def = f.default ?? '';
    if (value == null || value === '' || value === def) continue;
    chips.push({ id: f.id, label: f.label, value: f.optionLabels?.[value] ?? value });
  }
  return chips;
}
