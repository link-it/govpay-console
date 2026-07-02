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

import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Card con **visualizzazione e modifica inline**: header con titolo + pulsante
 * "Modifica", corpo che alterna la vista di sola lettura e il form di modifica,
 * footer (in edit) con Annulla/Salva. Generico e riusabile: i contenuti sono
 * forniti via content-projection con gli attributi `view` ed `edit`.
 *
 * Lo stato `editing` è a due vie: il parent lo riporta a `false` dopo un salvataggio
 * andato a buon fine (dopo che ha gestito l'output `save`).
 *
 * ```html
 * <lnk-inline-edit-card [title]="titolo" [(editing)]="editing" [saving]="saving()"
 *   (save)="onSave()" (cancel)="onCancel()">
 *   <div view><!-- lettura --></div>
 *   <form edit><!-- modifica --></form>
 * </lnk-inline-edit-card>
 * ```
 */
@Component({
  selector: 'lnk-inline-edit-card',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--card-bg)]">
      <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--border)]">
        <span class="text-sm font-semibold text-[var(--foreground)]">{{ title() }}</span>
        <div class="flex items-center gap-2">
          @if (editing()) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="onCancel()" [disabled]="saving()">
              {{ cancelKey() | translate }}
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="save.emit()" [disabled]="saving()">
              {{ saveKey() | translate }}
            </button>
          } @else if (canEdit()) {
            <button type="button" class="btn btn-secondary btn-sm" (click)="editing.set(true)">
              <ng-icon name="bootstrapPencil" size="0.9rem" />
              <span>{{ editKey() | translate }}</span>
            </button>
          }
        </div>
      </div>
      <div class="p-4">
        @if (editing()) {
          <ng-content select="[edit]" />
        } @else {
          <ng-content select="[view]" />
        }
      </div>
    </div>
  `,
})
export class InlineEditCardComponent {
  /** Titolo (testo già localizzato o valore grezzo). */
  readonly title = input<string>('');
  /** `true` mentre è in corso il salvataggio (disabilita i pulsanti). */
  readonly saving = input<boolean>(false);
  /** Mostra il pulsante "Modifica" (default `true`). */
  readonly canEdit = input<boolean>(true);
  /** Chiavi i18n dei pulsanti (override opzionali). */
  readonly editKey = input<string>('Common.Edit');
  readonly saveKey = input<string>('Common.Save');
  readonly cancelKey = input<string>('Common.Cancel');

  /** Stato di modifica, a due vie. */
  readonly editing = model<boolean>(false);

  readonly save = output<void>();
  readonly cancel = output<void>();

  protected onCancel(): void {
    this.editing.set(false);
    this.cancel.emit();
  }
}
