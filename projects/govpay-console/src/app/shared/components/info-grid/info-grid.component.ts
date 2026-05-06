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
 * Voce di una `<lnk-info-grid>`.
 *
 *   - `labelKey`: chiave i18n per la label.
 *   - `value`: valore già formattato (string | number).
 *   - `mono`: rende la cella in font monospace (utile per IUV/ID).
 *   - `wide`: la voce occupa l'intera larghezza (es. causale).
 *   - `hide`: salta la voce (utile per campi opzionali condizionali).
 */
export interface InfoGridItem {
  labelKey: string;
  value: string | number | null | undefined;
  mono?: boolean;
  wide?: boolean;
  hide?: boolean;
}

/**
 * Griglia label/value responsiva (1 colonna mobile, 2 sm+, 3 lg+).
 * I valori sono già formattati dal componente chiamante (date/euro).
 */
@Component({
  selector: 'lnk-info-grid',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
      @for (item of visibleItems; track item.labelKey) {
        <div [class.sm:col-span-2]="item.wide" [class.lg:col-span-3]="item.wide">
          <dt class="text-xs font-medium text-[var(--muted-foreground)]">
            {{ item.labelKey | translate }}
          </dt>
          <dd
            class="mt-0.5 break-words"
            [class.font-mono]="item.mono"
            [class.text-xs]="item.mono"
          >
            {{ item.value || '—' }}
          </dd>
        </div>
      }
    </dl>
  `,
})
export class InfoGridComponent {
  readonly items = input.required<InfoGridItem[]>();

  get visibleItems(): InfoGridItem[] {
    return this.items().filter((i) => !i.hide);
  }
}
