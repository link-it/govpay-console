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

import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Separatore orizzontale (linea 1px) per dividere i gruppi di contenuto dentro
 * una card di dettaglio (es. `<lnk-detail-section variant="plain">`).
 *
 *   <lnk-divider />         <!-- spaziatura normale (delegata al gap del container) -->
 *   <lnk-divider tight />   <!-- spaziatura ridotta: si avvicina all'elemento sopra
 *                                (es. subito sotto il titolo di sezione) -->
 *
 * Colore dalla CSS var `--card-border`. `tight` applica un `margin-top`
 * negativo per compensare il `gap` del flex-column che lo contiene.
 */
@Component({
  selector: 'lnk-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'separator',
    'aria-orientation': 'horizontal',
    '[style.margin-top.px]': 'tight() ? -8 : null',
  },
  styles: `
    :host {
      display: block;
      height: 1px;
      background: var(--card-border);
    }
  `,
  template: '',
})
export class DividerComponent {
  /** Spaziatura ridotta verso l'alto (ex utility `.lnk-divider.reduced`). */
  readonly tight = input(false, { transform: booleanAttribute });
}
