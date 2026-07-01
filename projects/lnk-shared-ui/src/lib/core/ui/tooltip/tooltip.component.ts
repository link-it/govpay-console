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
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  afterNextRender,
} from '@angular/core';

export type LnkTooltipVariant = 'default' | 'info' | 'warning' | 'custom';

/** Mappatura variante → classi Tailwind del contenitore tooltip. */
const VARIANT_CLASSES: Record<Exclude<LnkTooltipVariant, 'custom'>, string> = {
  default:
    'bg-zinc-900 text-white ring-1 ring-white/10 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-black/5',
  info:
    'bg-blue-600 text-white ring-1 ring-blue-400/30 dark:bg-blue-500 dark:text-white dark:ring-blue-300/30',
  warning:
    'bg-amber-500 text-white ring-1 ring-amber-300/40 dark:bg-amber-500 dark:text-amber-50 dark:ring-amber-300/30',
};

/**
 * Classi comuni a tutte le varianti (layout, animazione, accessibilità).
 *
 * `transition-[opacity,transform]` (invece di `transition-all`) evita il
 * flicker iniziale: CDK Overlay imposta `max-width`/`padding` al primo
 * frame di layout e con `transition-all` quei cambi venivano animati.
 */
const BASE_CLASSES =
  'pointer-events-none block max-w-xs rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg origin-center transition-[opacity,transform] duration-150 ease-out will-change-[opacity,transform]';

/**
 * Componente di rendering del tooltip.
 * Viene istanziato da `LnkTooltipDirective` tramite `ComponentPortal`
 * del CDK Overlay. Non si usa direttamente nei template del consumer.
 *
 * Tre varianti pre-definite (`default`, `info`, `warning`) + `custom`
 * per fornire classi Tailwind arbitrarie via `customClass`.
 */
@Component({
  selector: 'lnk-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    // Effetto "pop": fade + scale 95% → 100%. `origin-center` ancora
    // l'effetto al centro del tooltip. Vedi `BASE_CLASSES` per il
    // `transition-[opacity,transform]` + `ease-out` che governa il
    // timing.
    '[class.opacity-100]': 'visible()',
    '[class.opacity-0]': '!visible()',
    '[class.scale-100]': 'visible()',
    '[class.scale-95]': '!visible()',
    '[class]': 'containerClass()',
  },
  template: `{{ text() }}`,
})
export class LnkTooltipComponent {
  readonly text = input.required<string>();
  readonly variant = input<LnkTooltipVariant>('default');
  /** Classi Tailwind aggiuntive — usate da sole quando `variant === 'custom'`. */
  readonly customClass = input<string>('');

  readonly visible = signal(false);

  readonly containerClass = computed(() => {
    const v = this.variant();
    const base = BASE_CLASSES;
    const variantPart = v === 'custom' ? this.customClass() : VARIANT_CLASSES[v];
    return `${base} ${variantPart}`;
  });

  constructor() {
    // Triggera la transizione dopo che il browser ha eseguito layout +
    // paint dello stato iniziale (opacity-0 + scale-95), così la CSS
    // transition parte da quel frame esatto invece che dal default
    // del CDK Overlay panel (che altrimenti produce un flicker di
    // resize visibile sui primi millisecondi).
    afterNextRender(() => {
      requestAnimationFrame(() => this.visible.set(true));
    });
  }
}
