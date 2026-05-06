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
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Placeholder centrato per stato vuoto / errore / 404 ecc.
 *
 *   <lnk-empty-state
 *     icon="bootstrapInboxes"
 *     titleKey="Common.NoResults"
 *     descriptionKey="Common.NoResultsHint"
 *   >
 *     <button class="btn btn-secondary">Reset filtri</button>
 *   </lnk-empty-state>
 */
@Component({
  selector: 'lnk-empty-state',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
      @if (icon(); as i) {
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
        >
          <ng-icon [name]="i" size="1.5rem" />
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
  /** Nome icona Bootstrap registrato in `APP_ICONS`. */
  readonly icon = input<string | undefined>(undefined);
}
