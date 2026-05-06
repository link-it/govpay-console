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

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'muted';

/**
 * Badge colorato per stati / esiti. Il colore di sfondo deriva dal token
 * (success/info/warning/danger/muted), il testo è la traduzione di `labelKey`.
 *
 *   <lnk-status-badge [tone]="'success'" labelKey="Pendenze.Stati.Eseguita" />
 */
@Component({
  selector: 'lnk-status-badge',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 forced-colors:outline"
      [style.background-color]="bg()"
      [style.color]="fg()"
    >
      {{ labelKey() | translate }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly tone = input<StatusTone>('muted');
  readonly labelKey = input.required<string>();

  /** Testo: token tonale `--status-{tono}-text`. */
  readonly fg = computed(() => `var(--status-${this.tone()}-text)`);

  /** Sfondo: token tonale `--status-{tono}-bg` (color-mix tenue). */
  readonly bg = computed(() => `var(--status-${this.tone()}-bg)`);
}
