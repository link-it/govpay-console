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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LnkTooltipDirective } from '../../core/ui/tooltip/tooltip.directive';
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
  imports: [NgClass, NgStyle, NgIcon, TranslatePipe, LnkTooltipDirective],
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

  /**
   * Classe del `text`: `break-words` (default, va a capo e mostra tutto) oppure
   * `truncate` (una riga con ellissi) se `elem.wrap === false`. Concatena `elem.class`.
   */
  readonly textClass = computed<string>(() => {
    const e = this.elem();
    const mode = e.wrap === false ? 'block truncate' : 'break-words';
    return e.class ? `${mode} ${e.class}` : mode;
  });

  /** Title nativo col valore completo quando il testo è troncato (e senza tooltip esplicito). */
  readonly textTitle = computed<string | null>(() => {
    const e = this.elem();
    return e.type === 'text' && e.wrap === false && !this.tooltip() ? this.value() : null;
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

  // ============================================================
  // app-logo
  // ------------------------------------------------------------
  // Logo "ricco" per la rappresentazione di un'applicazione.
  // Il `field` deve puntare a un oggetto del tipo:
  //   {
  //     type: 'bootstrap' | 'material' | 'image' | 'svg' (case-insensitive),
  //     icon?: string,        // nome ng-icon (per type=bootstrap)
  //     micon?: string,       // nome material-icons (per type=material)
  //     url?: string,         // URL immagine (per type=image)
  //     icon_url?: string,    // URL SVG (per type=svg)
  //     bg_color?: string,    // colore di sfondo del container
  //     color?: string        // colore icona/testo
  //   }
  // `alt` punta al campo testuale per le iniziali di fallback (es.
  // `display_name`). `square` controlla il border-radius del container.
  // ============================================================

  /** Oggetto logo grezzo (resolved da `elem.field`). */
  private readonly appLogoData = computed<Record<string, unknown> | null>(() => {
    const v = this.raw();
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  });

  /** Tipo del logo, normalizzato lowercase. */
  readonly appLogoType = computed<string>(() => {
    const t = (this.appLogoData()?.['type'] as string | undefined) ?? '';
    return t.toLowerCase();
  });

  /** Colore di sfondo del container (default `#83B5D1`). */
  readonly appLogoBackColor = computed<string>(() => {
    return (this.appLogoData()?.['bg_color'] as string | undefined) ?? '#83B5D1';
  });

  /** Colore icona/testo (default `#ffffff`). */
  readonly appLogoTextColor = computed<string>(() => {
    return (this.appLogoData()?.['color'] as string | undefined) ?? '#ffffff';
  });

  /** Iniziali fallback dal campo `alt` (es. display_name → "DI"). */
  readonly appLogoText = computed<string>(() => {
    const e = this.elem();
    if (!e.alt) return '';
    const src = getObjectValue(this.data(), e.alt);
    return typeof src === 'string' ? src.slice(0, 2).toUpperCase() : '';
  });

  /**
   * Nome icona Bootstrap normalizzato per `@ng-icons/bootstrap-icons`
   * (prefisso `bootstrap` + CamelCase): es. `'mortarboard'` →
   * `'bootstrapMortarboard'`, `'person-fill'` → `'bootstrapPersonFill'`.
   * Se il valore è già prefissato (`'bootstrapXxx'`), resta invariato.
   * Richiede che il consumer abbia registrato le icone bootstrap via
   * `provideIcons({ ...bootstrapIcons })` (o subset).
   */
  readonly appLogoIcon = computed<string>(() => {
    const raw = (this.appLogoData()?.['icon'] as string | undefined) ?? '';
    if (!raw) return '';
    if (raw.startsWith('bootstrap') && /[A-Z]/.test(raw.charAt(9))) return raw;
    const camel = raw.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    return 'bootstrap' + camel.charAt(0).toUpperCase() + camel.slice(1);
  });

  /**
   * Nome icona Material normalizzato per `@ng-icons/material-icons`
   * (prefisso `mat` + CamelCase): es. `'school'` → `'matSchool'`,
   * `'shopping-cart'` → `'matShoppingCart'`. Se già prefissato resta
   * invariato. Richiede `provideIcons({ ...materialIcons })`.
   */
  readonly appLogoMicon = computed<string>(() => {
    const raw = (this.appLogoData()?.['micon'] as string | undefined) ?? '';
    if (!raw) return '';
    if (raw.startsWith('mat') && /[A-Z]/.test(raw.charAt(3))) return raw;
    const camel = raw.replace(/[-_]([a-z0-9])/g, (_, c) => c.toUpperCase());
    return 'mat' + camel.charAt(0).toUpperCase() + camel.slice(1);
  });

  /** URL immagine raster (per type=image). */
  readonly appLogoUrl = computed<string>(() => {
    return (this.appLogoData()?.['url'] as string | undefined) ?? '';
  });

  /** URL SVG (per type=svg). */
  readonly appLogoSvgUrl = computed<string>(() => {
    return (this.appLogoData()?.['icon_url'] as string | undefined) ?? '';
  });
}
