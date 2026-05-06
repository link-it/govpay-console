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

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Riga "label / control" dentro una `<lnk-tweak-section>`.
 *
 *   ```html
 *   <lnk-tweak-row labelKey="Tweaks.View" hintKey="Tweaks.ViewHint">
 *     <lnk-tweak-segmented .../>
 *   </lnk-tweak-row>
 *   ```
 *
 * Layout: label sopra, controllo sotto (verticale stacked) per dare il
 * massimo respiro ai control quando il drawer è stretto. `inline=true`
 * passa al layout orizzontale (label a sinistra, control a destra).
 */
@Component({
  selector: 'lnk-tweak-row',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    .lnk-tweak-row__label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--foreground);
      margin: 0;
    }
    .lnk-tweak-row__hint {
      display: block;
      font-size: 0.75rem;
      color: var(--muted-foreground);
      margin: 0.125rem 0 0;
    }
    .lnk-tweak-row--stack {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .lnk-tweak-row--inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .lnk-tweak-row--inline .lnk-tweak-row__label-wrap {
      flex: 1 1 0;
      min-width: 0;
    }
    .lnk-tweak-row__control {
      min-width: 0;
    }
  `,
  template: `
    <div [class]="inline() ? 'lnk-tweak-row--inline' : 'lnk-tweak-row--stack'">
      @if (labelKey(); as l) {
        <div class="lnk-tweak-row__label-wrap">
          <span class="lnk-tweak-row__label">{{ l | translate }}</span>
          @if (hintKey(); as h) {
            <span class="lnk-tweak-row__hint">{{ h | translate }}</span>
          }
        </div>
      }
      <div class="lnk-tweak-row__control">
        <ng-content />
      </div>
    </div>
  `,
})
export class TweakRowComponent {
  readonly labelKey = input<string | undefined>(undefined);
  readonly hintKey = input<string | undefined>(undefined);
  /** Layout orizzontale: label sx, control dx. Default `false` (stacked). */
  readonly inline = input<boolean>(false);
}
