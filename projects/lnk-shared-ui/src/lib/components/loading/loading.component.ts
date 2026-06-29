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

export type LoadingSize = 'sm' | 'md' | 'lg';

/**
 * Indicatore di caricamento con spinner CSS + label i18n.
 *
 * Varianti:
 * - `inline=true` (default false): rende un blocco inline con spinner
 *   accanto al testo, senza padding/centratura. Adatto al footer paginato.
 * - `size`: 'sm' | 'md' (default) | 'lg' — dimensione spinner e font.
 * - `labelKey`: chiave i18n del testo (default `Common.Loading`).
 *   Se `null` mostra solo lo spinner.
 *
 *   <lnk-loading inline size="sm" />
 *   <lnk-loading />
 */
@Component({
  selector: 'lnk-loading',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .lnk-spinner {
      display: inline-block;
      border-radius: 9999px;
      border-style: solid;
      border-color: var(--primary);
      border-top-color: transparent;
      animation: lnk-spin 0.8s linear infinite;
    }
    @keyframes lnk-spin { to { transform: rotate(360deg); } }
  `,
  template: `
    @if (inline()) {
      <span class="inline-flex items-center gap-2 text-[var(--muted-foreground)]" [class]="textSizeClass()">
        <span class="lnk-spinner" [class]="spinnerSizeClass()" role="status" aria-hidden="true"></span>
        @if (labelKey(); as k) {
          <span>{{ k | translate }}</span>
        }
      </span>
    } @else {
      <div class="flex flex-col items-center justify-center text-center py-12 px-4 gap-3" [class]="textSizeClass()">
        <span class="lnk-spinner" [class]="spinnerSizeClass()" role="status" aria-hidden="true"></span>
        @if (labelKey(); as k) {
          <p class="text-[var(--muted-foreground)]">{{ k | translate }}</p>
        }
      </div>
    }
  `,
})
export class LoadingComponent {
  readonly labelKey = input<string | null>('Common.Loading');
  readonly size = input<LoadingSize>('md');
  readonly inline = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly spinnerSizeClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'w-3.5 h-3.5 border-2';
      case 'lg': return 'w-10 h-10 border-4';
      default:   return 'w-6 h-6 border-2';
    }
  });

  protected readonly textSizeClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default:   return 'text-sm';
    }
  });
}
