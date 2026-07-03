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

import type { TweakSegmentedOption } from '../core/ui/tweaks/tweaks-types';
import { daysAgoIso } from './format';

/**
 * Costanti condivise per il pattern "tweaks panel sulle liste".
 *
 * Usate dalle feature list (pendenze, ricevute, pagamenti, ...) per
 * popolare i `<lnk-tweak-segmented>` di vista (`table` / `rows`) e
 * range di date pre-impostati. Centralizzate qui per evitare drift fra
 * le liste e mantenere uniforme la UX del pannello.
 */

/** Vista lista: tabella vs righe driven-by-config. */
export const VIEW_OPTIONS: TweakSegmentedOption[] = [
  { value: 'table', labelKey: 'Tweaks.View.Table' },
  { value: 'rows', labelKey: 'Tweaks.View.Rows' },
];

/** Variante grafica della barra di ricerca `<lnk-search-pill>`. */
export const SEARCH_PILL_VARIANT_OPTIONS: TweakSegmentedOption[] = [
  { value: 'pill', labelKey: 'Tweaks.SearchPill.Pill' },
  { value: 'square', labelKey: 'Tweaks.SearchPill.Square' },
];

/**
 * Range di date pre-impostati (espressi come giorni-fa). Cliccando su
 * un preset si imposta `filters.dataDa = daysAgoIso(N)`.
 */
export const DATE_RANGE_OPTIONS: TweakSegmentedOption[] = [
  { value: '30', labelKey: 'Tweaks.Range.Month' },
  { value: '90', labelKey: 'Tweaks.Range.ThreeMonths' },
  { value: '180', labelKey: 'Tweaks.Range.SixMonths' },
  { value: '365', labelKey: 'Tweaks.Range.Year' },
];

/**
 * Restituisce il preset attivo (`'30' | '90' | '180' | '365'`) se
 * `dataDa` corrisponde esattamente a `daysAgoIso(N)`, altrimenti `''`
 * (date personalizzate o default settimanale).
 */
export function matchDateRangePreset(dataDa: string | undefined | null): string {
  if (!dataDa) return '';
  for (const opt of DATE_RANGE_OPTIONS) {
    if (dataDa === daysAgoIso(Number(opt.value))) return opt.value;
  }
  return '';
}
