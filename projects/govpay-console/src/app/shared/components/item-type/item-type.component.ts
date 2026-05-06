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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  formatDate,
  formatDateTime,
  formatEuro,
  formatMsTime,
  formatTimeAgo,
  truncateRows,
  resolveDisplayStyle,
  getObjectValue,
  type DisplayStyle,
} from '../../utils';
import type {
  DisplayConfig,
  ItemTypeElement,
} from '../item-row/display-config.types';

/**
 * Renderizza un singolo "campo" di una riga driven-by-config.
 * Adattato dal componente `ui-item-type` di GovHub
 * (`core/ui/item-type/item-type.component.{ts,html}`), portato a:
 *   - Angular 21 standalone + signals + OnPush
 *   - Tailwind 4 con CSS variables del tema GovPay
 *   - utility di formato esistenti (`formatDate`, `formatEuro`)
 *   - icone via `@ng-icons/bootstrap-icons` (no Bootstrap CSS classes)
 *
 * Il chiamante passa un `data` row, l'`elem` (descrittore di campo) e
 * la `config` globale (per risolvere `options.statusXxx.values[v]`).
 */
@Component({
  selector: 'lnk-item-type',
  standalone: true,
  imports: [NgClass, NgStyle, NgIcon, TranslatePipe, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-type.component.html',
  // Host class `lnk-no-sep` per consentire al wrapper `lnk-sep` di
  // sopprimere il puntino separatore prima di questo item.
  host: {
    '[class.lnk-no-sep]': 'elem()?.noSeparator',
  },
})
export class ItemTypeComponent {
  private readonly translate = inject(TranslateService);

  readonly data = input.required<unknown>();
  readonly elem = input.required<ItemTypeElement>();
  readonly config = input<DisplayConfig | null>(null);

  /** Valore grezzo letto via `elem.field`. */
  private readonly raw = computed(() => {
    const e = this.elem();
    const value = getObjectValue(this.data(), e.field);
    return value ?? e.default ?? null;
  });

  /** Group di option di riferimento (`config.options[elem.options]`). */
  private readonly optionGroup = computed(() => {
    const cfg = this.config();
    const name = this.elem().options;
    return name ? cfg?.options?.[name] : undefined;
  });

  /** Entry option per il valore grezzo (es. `{ label, background, color }`). */
  private readonly optionEntry = computed(() => {
    const group = this.optionGroup();
    const v = String(this.raw() ?? '');
    return group?.values?.[v];
  });

  /** Valore visualizzato. Per status/label/tag/labelI18n usa `option.label`. */
  readonly value = computed<string>(() => {
    const e = this.elem();
    // `simplelabel` è statico: NON dipende da `data` né dal raw value,
    // quindi va valutato PRIMA dell'early return su `v == null`.
    if (e.type === 'simplelabel') {
      return e.label ?? e.field ?? e.default ?? '';
    }
    // `message` è anch'esso statico (testo dalla i18n key passata in `field`).
    if (e.type === 'message') return e.field ?? '';
    const v = this.raw();
    if (v == null) return '';
    if (e.type === 'date') return formatDate(v as string);
    if (e.type === 'datetime') return formatDateTime(v as string);
    if (e.type === 'mstime') return formatMsTime(v as number | string);
    if (e.type === 'timeago') return formatTimeAgo(v as string);
    if (e.type === 'currency') return formatEuro(v as number | string);
    if (e.type === 'text') {
      // Risolve come chiave i18n se `i18nPrefix` set; opzionalmente
      // nidificata sotto un altro field via `i18nPrefixField`. Fallback
      // al raw se la traduzione non esiste (translate ritorna la chiave).
      let display = String(v);
      if (e.i18nPrefix) {
        const scope = e.i18nPrefixField
          ? String(getObjectValue(this.data(), e.i18nPrefixField) ?? '')
          : '';
        const key = scope
          ? `${e.i18nPrefix}.${scope}.${v}`
          : `${e.i18nPrefix}.${v}`;
        const translated = this.translate.instant(key);
        if (translated && translated !== key) display = translated;
      }
      return e.truncate ? truncateRows(display, 2, e.truncate) : display;
    }
    if (e.type === 'cardinal') return `#${v}`;
    if (e.type === 'icon') {
      // Per type=icon il "valore" è il NOME ICONA: o dall'option, o `elem.icon`, o il raw.
      return this.optionEntry()?.icon ?? e.icon ?? String(v);
    }
    if (e.type === 'status' || e.type === 'label' || e.type === 'tag' || e.type === 'labelI18n') {
      // Se l'option group è presente risolve il `label` (chiave i18n);
      // altrimenti restituisce il valore grezzo come stringa.
      const entry = this.optionEntry();
      return entry?.label ?? String(v);
    }
    return String(v);
  });

  /** Label sopra/lato (per status/label). */
  readonly labelText = computed<string>(() => {
    const e = this.elem();
    if (e.type === 'status') return this.config()?.options?.['statusLabel'] as unknown as string ?? 'Status';
    // Per `label`: prefisso opzionale (es. "Categoria: Interfaccia").
    // Risolve da `optionGroup.label` (i18n key sul gruppo) → `elem.label`
    // (i18n key sull'elemento). NON usare `e.options` come fallback:
    // è il nome INTERNO del gruppo (es. `CATEGORIE_EVENTO`), non una
    // label per l'utente. Senza label esplicita, niente prefisso.
    if (e.type === 'label') return this.optionGroup()?.label ?? e.label ?? '';
    return e.label ?? '';
  });

  /** Stile colorato (background/border/color) per status/label/tag. */
  readonly style = computed<DisplayStyle | null>(() => {
    const e = this.elem();
    if (e.type !== 'status' && e.type !== 'label' && e.type !== 'tag') return null;
    const entry = this.optionEntry();
    const fallback = this.optionGroup()?.values?.['default'];
    return resolveDisplayStyle(entry, fallback);
  });

  /** Tooltip (Material). Risolve i descrittori `{ field, options, label }`. */
  readonly tooltip = computed<string>(() => {
    const e = this.elem();
    if (e.hideTooltip || !e.tooltip) return '';
    if (typeof e.tooltip === 'string') {
      // Se è un path che esiste sul data, usa quello, altrimenti i18n.
      const v = getObjectValue(this.data(), e.tooltip);
      return v ? String(v) : this.translate.instant(e.tooltip);
    }
    // Descrittore: {field, options, label}
    const desc = e.tooltip;
    const v = String(getObjectValue(this.data(), desc.field) ?? '');
    const opt = desc.options ? this.config()?.options?.[desc.options]?.values?.[v] : undefined;
    const label = desc.label ? this.translate.instant(desc.label) : '';
    const text = opt?.tooltip ? this.translate.instant(opt.tooltip) : v;
    return label ? `${label}: ${text}` : text;
  });

  readonly tooltipPlacement = computed<'left' | 'right' | 'above' | 'below'>(() => {
    const e = this.elem();
    const p = (typeof e.tooltip === 'object' ? e.tooltip.placement : e.tooltipPlacement) ?? 'above';
    if (p === 'top') return 'above';
    if (p === 'bottom') return 'below';
    return p as 'left' | 'right' | 'above' | 'below';
  });

  /** Iniziali per avatar-image fallback (campo `alt`). */
  readonly initials = computed<string>(() => {
    const e = this.elem();
    if (e.type !== 'avatar-image' || !e.alt) return '';
    const src = getObjectValue(this.data(), e.alt);
    return typeof src === 'string' ? src.slice(0, 2).toUpperCase() : '';
  });

  /** Showed=false ⇒ nasconde tutto (per `hideEmpty`/`hideZero`). */
  readonly visible = computed<boolean>(() => {
    const e = this.elem();
    // `simplelabel` è testo statico: visibile se almeno uno tra
    // `label`/`field`/`default` è valorizzato (NON dipende dal data row).
    if (e.type === 'simplelabel') return !!(e.label || e.field || e.default);
    const v = this.raw();
    if (e.hideEmpty && (v == null || v === '')) return false;
    if (e.hideZero && (v === 0 || v === '0')) return false;
    return true;
  });

  /** Per `tags`: array di stringhe. */
  readonly tagList = computed<string[]>(() => {
    const v = this.raw();
    return Array.isArray(v) ? v.map(String) : [];
  });

  /** Avatar URL (per `avatar-image`/`image`). */
  readonly imageUrl = computed<string>(() => String(this.raw() ?? ''));
}
