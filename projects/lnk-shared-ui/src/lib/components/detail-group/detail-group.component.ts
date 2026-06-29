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
import { LNK_IN_DETAIL_GROUP } from './detail-group.token';

/**
 * Container card che raggruppa piu` `<lnk-detail-section>` correlate
 * eliminando i bordi delle section figlie. Utile per presentare un
 * blocco di informazioni attinenti come un'unica "scheda" coesa.
 *
 *   ```html
 *   <lnk-detail-group titleKey="Pendenze.Detail.Title">
 *     <lnk-detail-section titleKey="Pendenze.Detail.Generali">
 *       <lnk-info-grid [items]="..." />
 *     </lnk-detail-section>
 *     <lnk-detail-section titleKey="Pendenze.Detail.EnteCreditore">
 *       <lnk-info-grid [items]="..." />
 *     </lnk-detail-section>
 *   </lnk-detail-group>
 *   ```
 *
 * Il group fornisce in DI il token `LNK_IN_DETAIL_GROUP=true`. Le
 * `<lnk-detail-section>` annidate con `variant='auto'` (default) lo
 * leggono e diventano automaticamente `variant='embedded'` (niente
 * bordo proprio, solo header + divider sotto). Il consumer puo`
 * forzare `variant='card'` su una section specifica per "spezzare"
 * il gruppo se serve.
 *
 * `titleKey` opzionale: se omesso, il group e` solo un wrapping
 * visivo senza intestazione.
 */
@Component({
  selector: 'lnk-detail-group',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: LNK_IN_DETAIL_GROUP, useValue: true }],
  host: {
    class:
      'block rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] p-4',
  },
  styles: `
    :host:not(:last-of-type) { margin-bottom: 1.5rem; }
  `,
  template: `
    @if (titleKey(); as key) {
      <header class="pb-3 mb-4 border-b border-[var(--card-border)]">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {{ key | translate }}
        </h2>
      </header>
    }
    <ng-content />
  `,
})
export class DetailGroupComponent {
  /** Titolo opzionale del group (i18n key). Se omesso, niente header. */
  readonly titleKey = input<string | undefined>(undefined);
}
