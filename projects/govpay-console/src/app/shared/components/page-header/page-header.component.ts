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

import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { formatNumber } from '../../utils/format';
import { LoadingComponent } from '../loading/loading.component';

/**
 * Intestazione di una pagina di feature: titolo grande + sottotitolo opzionale.
 *
 * Le azioni (pulsanti) si proiettano via slot:
 *
 *   <lnk-page-header titleKey="Nav.Pendenze" subtitleKey="Pendenze.Subtitle" [total]="total()">
 *     <button class="btn btn-primary">Nuova</button>
 *   </lnk-page-header>
 */
@Component({
  selector: 'lnk-page-header',
  standalone: true,
  imports: [TranslatePipe, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4 mb-4">
      <div class="min-w-0">
        <div class="flex items-baseline gap-2 min-w-0">
          <h1 class="text-2xl font-semibold truncate">{{ titleKey() | translate }}</h1>
          @if (loading()) {
            <lnk-loading [inline]="true" size="sm" [labelKey]="null" />
          } @else if (totalLabel(); as t) {
            <span class="text-sm font-medium text-[var(--muted-foreground)] tabular-nums whitespace-nowrap">{{ t }}</span>
          }
        </div>
        @if (subtitleKey(); as key) {
          <p class="text-sm text-[var(--muted-foreground)] mt-1">{{ key | translate }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string | undefined>(undefined);
  /** Totale risultati (mostrato accanto al titolo, formattato con separatore migliaia). */
  readonly total = input<number | null | undefined>(null);
  /** Se `true` sostituisce il counter con uno spinner inline. */
  readonly loading = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly totalLabel = computed(() => {
    const t = this.total();
    return t == null ? null : formatNumber(t);
  });
}
