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

import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Voce di una `<lnk-info-grid>`.
 *
 *   - `labelKey`: chiave i18n per la label.
 *   - `value`: valore già formattato (string | number).
 *   - `mono`: rende la cella in font monospace (utile per IUV/ID).
 *   - `wide`: la voce occupa l'intera larghezza (es. causale).
 *   - `hide`: salta la voce (utile per campi opzionali condizionali).
 */
export interface InfoGridItem {
  labelKey: string;
  value: string | number | null | undefined;
  mono?: boolean;
  wide?: boolean;
  hide?: boolean;
}

export type InfoGridSize = 'sm' | 'md' | 'lg' | string;

// Preset Tailwind per la dimensione del testo. Coppie label/value:
// la label è sempre uno step più piccola del value. Default `sm`
// mantiene il comportamento storico (value text-sm, label text-xs).
const VALUE_SIZE_PRESETS: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const LABEL_SIZE_PRESETS: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Griglia label/value responsiva (1 colonna mobile, 2 sm+, 3 lg+).
 * I valori sono già formattati dal componente chiamante (date/euro).
 *
 *   <lnk-info-grid [items]="items" />            <!-- size sm (default) -->
 *   <lnk-info-grid [items]="items" size="md" />  <!-- value text-base, label text-sm -->
 *   <lnk-info-grid [items]="items" size="lg" />  <!-- value text-lg, label text-base -->
 *   <lnk-info-grid [items]="items" uppercaseLabels />  <!-- label maiuscole + tracking-wider -->
 *
 * `size` accetta anche una coppia Tailwind arbitraria nel formato
 * `'<value>|<label>'` (es. `'text-2xl|text-base'`) per casi speciali.
 */
@Component({
  selector: 'lnk-info-grid',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
      @for (item of visibleItems; track item.labelKey) {
        <div [class.sm:col-span-2]="item.wide" [class.lg:col-span-3]="item.wide">
          <dt [class]="labelClass()">
            {{ item.labelKey | translate }}
          </dt>
          <dd [class]="valueClass(item)">
            {{ item.value || '—' }}
          </dd>
        </div>
      }
    </dl>
  `,
})
export class InfoGridComponent {
  readonly items = input.required<InfoGridItem[]>();
  /**
   * Dimensione del testo. Preset `sm` (default, value `text-sm` +
   * label `text-xs`) | `md` (value `text-base` + label `text-sm`) |
   * `lg` (value `text-lg` + label `text-base`). Per coppie custom
   * usa la sintassi `'<value-class>|<label-class>'` (es.
   * `'text-2xl|text-base'`).
   */
  readonly size = input<InfoGridSize>('sm');
  /**
   * Quando `true` le label (`<dt>`) sono rese in MAIUSCOLO con
   * `tracking-wider` (pattern caps tipico delle "Info box" Link.it,
   * es. vecchio blocco "Informazioni report"). Default `false`.
   */
  readonly uppercaseLabels = input<boolean, unknown>(false, { transform: booleanAttribute });

  get visibleItems(): InfoGridItem[] {
    return this.items().filter((i) => !i.hide);
  }

  /** Solo la classe Tailwind di size per il value (es. `text-sm`). */
  private readonly valueSize = computed(() => {
    const s = this.size();
    if (VALUE_SIZE_PRESETS[s]) return VALUE_SIZE_PRESETS[s];
    if (s.includes('|')) return s.split('|')[0];
    return s;
  });

  /** Solo la classe Tailwind di size per la label (es. `text-xs`). */
  private readonly labelSize = computed(() => {
    const s = this.size();
    if (LABEL_SIZE_PRESETS[s]) return LABEL_SIZE_PRESETS[s];
    if (s.includes('|')) return s.split('|')[1] ?? 'text-xs';
    return s;
  });

  /**
   * Stringa completa di classi per il `<dt>` (label).
   * Unifica le 3 sorgenti — base statica, size dinamica, caps
   * opzionale — in un solo binding `[class]` per evitare conflitti
   * tra `[class]` (stringa) e `[class.x]` (toggle) che in alcuni
   * scenari Angular può azzerare al re-render.
   */
  readonly labelClass = computed(() => {
    const base = `font-medium text-[var(--muted-foreground)] ${this.labelSize()}`;
    return this.uppercaseLabels() ? `${base} uppercase tracking-wider` : base;
  });

  /**
   * Stringa completa di classi per il `<dd>` (value). `mono` ha
   * priorità sul `size` (i campi monospace restano sempre `text-xs`).
   */
  valueClass(item: InfoGridItem): string {
    const base = 'mt-0.5 break-words';
    return item.mono ? `${base} font-mono text-xs` : `${base} ${this.valueSize()}`;
  }
}
