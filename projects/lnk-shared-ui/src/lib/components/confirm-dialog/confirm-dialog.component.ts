/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Dialog di conferma minimale (backdrop + card), standalone/OnPush.
 *
 * Generico: le label sono chiavi i18n (default `Common.Confirm`/`Common.Cancel`).
 * Il componente è "controllato" dal chiamante tramite `open`; emette `confirm`
 * o `cancel` e non gestisce da sé la chiusura (spetta al parent aggiornare `open`).
 *
 * ```html
 * <lnk-confirm-dialog
 *   [open]="askConsenso()"
 *   titleKey="Pendenze.Detail.DebitoreConsensoTitolo"
 *   messageKey="Pendenze.Detail.DebitoreConsensoTesto"
 *   (confirm)="onConfermato()"
 *   (cancel)="askConsenso.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'lnk-confirm-dialog',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="cancel.emit()"></div>
        <div
          role="dialog"
          aria-modal="true"
          class="relative z-10 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-xl space-y-4"
        >
          <h2 class="text-lg font-semibold text-[var(--foreground)]">{{ titleKey() | translate }}</h2>
          <p class="text-sm text-[var(--muted-foreground)]">{{ messageKey() | translate }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="cancel.emit()">
              {{ cancelKey() | translate }}
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="confirm.emit()">
              {{ confirmKey() | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input<boolean>(false);
  readonly titleKey = input<string>('Common.Confirm');
  readonly messageKey = input.required<string>();
  readonly confirmKey = input<string>('Common.Confirm');
  readonly cancelKey = input<string>('Common.Cancel');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
