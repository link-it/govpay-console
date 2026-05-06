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
 * Sezione di una pagina di dettaglio: card con titolo i18n e slot contenuto.
 *
 *   <lnk-detail-section titleKey="Pendenze.Detail.Generali">
 *     <lnk-info-grid [items]="..." />
 *   </lnk-detail-section>
 */
@Component({
  selector: 'lnk-detail-section',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    /* Spazio tra più sezioni di dettaglio impilate. L'ultima
       (o l'unica) non riceve margin-bottom. */
    :host:not(:last-of-type) { margin-bottom: 1.5rem; }
  `,
  template: `
    <section
      class="rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]"
    >
      <header class="px-4 py-3 border-b border-[var(--card-border)]">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {{ titleKey() | translate }}
        </h2>
      </header>
      <div class="p-4">
        <ng-content />
      </div>
    </section>
  `,
})
export class DetailSectionComponent {
  readonly titleKey = input.required<string>();
}
