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

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Input data minimale (`<input type="date">`) con label i18n.
 * Il valore è una stringa `YYYY-MM-DD` (formato HTML5 nativo); le feature lo
 * convertono in ISO 8601 quando lo passano alle API GovPay.
 */
@Component({
  selector: 'lnk-date-input',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="flex flex-col gap-1 min-w-0">
      @if (labelKey(); as key) {
        <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ key | translate }}</span>
      }
      <input
        type="date"
        class="px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        [value]="value()"
        [max]="max()"
        [min]="min()"
        (change)="onChange($event)"
      />
    </label>
  `,
})
export class DateInputComponent {
  readonly value = input<string>('');
  readonly labelKey = input<string | undefined>(undefined);
  readonly min = input<string | undefined>(undefined);
  readonly max = input<string | undefined>(undefined);

  readonly valueChange = output<string>();

  onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
