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
 * Sezione raggruppante dentro `<lnk-tweaks-panel>`.
 *
 *   ```html
 *   <lnk-tweak-section titleKey="Tweaks.Layout" descriptionKey="Tweaks.LayoutHint">
 *     <lnk-tweak-row .../>
 *     <lnk-tweak-row .../>
 *   </lnk-tweak-section>
 *   ```
 */
@Component({
  selector: 'lnk-tweak-section',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    :host + :host {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--card-border);
    }
    .lnk-tweak-section__title {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted-foreground);
      margin: 0 0 0.5rem;
    }
    .lnk-tweak-section__description {
      font-size: 0.75rem;
      color: var(--muted-foreground);
      margin: 0 0 0.75rem;
    }
  `,
  template: `
    @if (titleKey(); as t) {
      <h3 class="lnk-tweak-section__title">{{ t | translate }}</h3>
    }
    @if (descriptionKey(); as d) {
      <p class="lnk-tweak-section__description">{{ d | translate }}</p>
    }
    <div class="space-y-3">
      <ng-content />
    </div>
  `,
})
export class TweakSectionComponent {
  readonly titleKey = input<string | undefined>(undefined);
  readonly descriptionKey = input<string | undefined>(undefined);
}
