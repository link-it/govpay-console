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

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

export type EmptyStateSize = 'sm' | 'md' | 'lg' | 'xl' | string;

// Dimensione del container "pillola" che ospita la ng-icon. L'icona è
// 50% del container per mantenere il padding visivo che aveva il vecchio
// layout (w-12 h-12 + ng-icon 1.5rem).
const CONTAINER_PRESETS: Record<string, string> = {
  sm: '2rem',
  md: '3rem',
  lg: '5rem',
  xl: '7rem',
};

const ICON_PRESETS: Record<string, string> = {
  sm: '1rem',
  md: '1.5rem',
  lg: '2.5rem',
  xl: '3.5rem',
};

// Per l'immagine non c'è container "pillola": la box di rendering è
// l'immagine stessa, quindi va dimensionata più generosamente.
const IMAGE_PRESETS: Record<string, string> = {
  sm: '4rem',
  md: '6rem',
  lg: '8rem',
  xl: '10rem',
};

/**
 * Placeholder centrato per stato vuoto / errore / 404 ecc.
 *
 *   <lnk-empty-state
 *     icon="bootstrapInboxes"
 *     titleKey="Common.NoResults"
 *     descriptionKey="Common.NoResultsHint"
 *     size="lg"
 *   >
 *     <button class="btn btn-secondary">Reset filtri</button>
 *   </lnk-empty-state>
 *
 *   <lnk-empty-state
 *     image="./assets/illustrations/gear.svg"
 *     titleKey="app.message.NoData"
 *     size="xl"
 *   />
 *
 * `image` ha priorità su `icon` quando entrambi sono valorizzati.
 * `size` accetta uno dei preset ('sm'|'md'|'lg'|'xl') o una stringa CSS
 * arbitraria (es. '110px') per dimensionare il visual.
 */
@Component({
  selector: 'lnk-empty-state',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
      @if (image(); as img) {
        <img
          [src]="img"
          [alt]="(titleKey() | translate)"
          [style.width]="imageSize()"
          [style.height]="imageSize()"
          class="object-contain"
        />
      } @else if (icon(); as i) {
        <div
          class="inline-flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
          [style.width]="containerSize()"
          [style.height]="containerSize()"
        >
          <ng-icon [name]="i" [size]="iconSize()" />
        </div>
      }
      <h2 class="text-lg font-medium">{{ titleKey() | translate }}</h2>
      @if (descriptionKey(); as d) {
        <p class="text-sm text-[var(--muted-foreground)] max-w-md">{{ d | translate }}</p>
      }
      <div class="flex gap-2 mt-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string | undefined>(undefined);
  /** Nome icona Bootstrap registrato in `APP_ICONS`. Ignorato se `image` è valorizzato. */
  readonly icon = input<string | undefined>(undefined);
  /** URL/path immagine (SVG/PNG). Ha priorità su `icon` quando presente. */
  readonly image = input<string | undefined>(undefined);
  /**
   * Preset di dimensione (`sm` | `md` | `lg` | `xl`) o stringa CSS
   * arbitraria (es. `'110px'`, `'5rem'`). Default `'md'` — corrisponde
   * al w-12/h-12 del layout originale.
   */
  readonly size = input<EmptyStateSize>('md');

  /** Lato del container "pillola" attorno alla ng-icon. */
  readonly containerSize = computed(() => CONTAINER_PRESETS[this.size()] ?? this.size());
  /** Lato della ng-icon (≈50% del container per i preset). */
  readonly iconSize = computed(() => ICON_PRESETS[this.size()] ?? this.size());
  /** Lato dell'`<img>` quando si usa `image`. */
  readonly imageSize = computed(() => IMAGE_PRESETS[this.size()] ?? this.size());
}
