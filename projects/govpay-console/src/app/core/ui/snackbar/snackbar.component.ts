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

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SnackbarService, type SnackbarLevel } from './snackbar.service';

const ICON_BY_LEVEL: Record<SnackbarLevel, string> = {
  success: 'bootstrapCheckCircle',
  info: 'bootstrapInfoCircle',
  warning: 'bootstrapExclamationTriangle',
  error: 'bootstrapXCircle',
};

const COLOR_VAR_BY_LEVEL: Record<SnackbarLevel, string> = {
  success: '--success',
  info: '--info',
  warning: '--warning',
  error: '--danger',
};

@Component({
  selector: 'lnk-snackbar',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-[calc(100%-2rem)]"
      role="status"
      aria-live="polite"
    >
      @for (m of messages(); track m.id) {
        <div
          class="flex items-start gap-3 rounded-md border bg-[var(--card-bg)] shadow-lg p-3 text-sm"
          [style.border-color]="'var(' + colorVar(m.level) + ')'"
          [style.color]="'var(' + colorVar(m.level) + ')'"
        >
          <ng-icon [name]="iconFor(m.level)" size="1.125rem" class="mt-0.5 shrink-0" />
          <span class="flex-1 text-[var(--foreground)]">{{ m.text }}</span>
          <button
            type="button"
            class="opacity-60 hover:opacity-100"
            (click)="dismiss(m.id)"
            [attr.aria-label]="'Snackbar.Close' | translate"
          >
            <ng-icon name="bootstrapX" size="1rem" />
          </button>
        </div>
      }
    </div>
  `,
})
export class SnackbarComponent {
  private readonly service = inject(SnackbarService);
  readonly messages = this.service.messages;

  iconFor(level: SnackbarLevel): string {
    return ICON_BY_LEVEL[level];
  }

  colorVar(level: SnackbarLevel): string {
    return COLOR_VAR_BY_LEVEL[level];
  }

  dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
