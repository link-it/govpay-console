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
 * Opzione del `lnk-select-input`. `labelKey` è una **chiave i18n**
 * (tradotta nel template); usa `label` per testo già localizzato.
 */
export interface SelectOption {
  value: string;
  /** Chiave i18n per la label. Alternativa a `label`. */
  labelKey?: string;
  /** Testo statico (già localizzato). Alternativa a `labelKey`. */
  label?: string;
}

/**
 * Wrapper minimale di `<select>`. Tailwind-styled, integrato con `translate`.
 *
 *   <lnk-select-input
 *     labelKey="Pendenze.Filters.Stato"
 *     placeholderKey="Common.All"
 *     [value]="filter.stato"
 *     [options]="statoOptions"
 *     (valueChange)="onStatoChange($event)"
 *   />
 *
 * Quando `value === ''` mostra il placeholder. Per "tutti" passa `value=''`.
 */
@Component({
  selector: 'lnk-select-input',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="flex flex-col gap-1 min-w-0">
      @if (labelKey(); as key) {
        <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ key | translate }}</span>
      }
      <select
        class="px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        [value]="value()"
        (change)="onChange($event)"
      >
        <option value="">{{ placeholderKey() | translate }}</option>
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value">
            {{ opt.labelKey ? (opt.labelKey | translate) : opt.label }}
          </option>
        }
      </select>
    </label>
  `,
})
export class SelectInputComponent {
  readonly value = input<string>('');
  readonly options = input.required<SelectOption[]>();
  readonly labelKey = input<string | undefined>(undefined);
  readonly placeholderKey = input<string>('Common.All');

  readonly valueChange = output<string>();

  onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
