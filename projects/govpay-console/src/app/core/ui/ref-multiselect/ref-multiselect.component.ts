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

import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { REF_ALL } from '@core/models';

/** Opzione suggerita per il multi-select (id + etichetta descrittiva). */
export interface RefOption {
  id: string;
  label?: string;
}

/**
 * Multi-select di riferimenti (id) riusabile per le associazioni di Operatori /
 * Applicazioni (domini, tipi pendenza, ruoli). Valore a due vie `string[]` di
 * id; `['*']` = "tutti" (se `allowAll`). Supporta suggerimenti via `<datalist>`
 * ma consente anche l'inserimento libero di un id.
 *
 *   <lnk-ref-multiselect [(value)]="domini" [suggestions]="opts" [allowAll]="true" />
 */
@Component({
  selector: 'lnk-ref-multiselect',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (allowAll()) {
      <label class="flex items-center gap-2 mb-2">
        <input type="checkbox" class="h-4 w-4 accent-[var(--primary)]" [checked]="isAll()" (change)="toggleAll($any($event.target).checked)" />
        <span class="text-sm">{{ 'RefSelect.All' | translate }}</span>
      </label>
    }

    @if (!isAll()) {
      @if (value().length) {
        <div class="flex flex-wrap gap-1.5 mb-2">
          @for (id of value(); track id) {
            <span class="inline-flex items-center gap-1 rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs">
              {{ labelFor(id) }}
              <button type="button" class="text-[var(--muted-foreground)] hover:text-[var(--danger)]" [attr.aria-label]="'RefSelect.Remove' | translate" (click)="remove(id)">
                <ng-icon name="bootstrapX" size="0.85rem" />
              </button>
            </span>
          }
        </div>
      }
      <div class="flex gap-2">
        <input
          #inp
          type="text"
          [attr.list]="listId"
          [placeholder]="placeholderKey() | translate"
          class="flex-1 px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          (keydown.enter)="$event.preventDefault(); add(inp.value); inp.value = ''"
        />
        <datalist [id]="listId">
          @for (s of suggestions(); track s.id) {
            <option [value]="s.id">{{ s.label }}</option>
          }
        </datalist>
        <button type="button" class="btn btn-secondary btn-sm" (click)="add(inp.value); inp.value = ''">
          {{ 'RefSelect.Add' | translate }}
        </button>
      </div>
    }
  `,
})
export class RefMultiselectComponent {
  private static seq = 0;
  protected readonly listId = `ref-ms-${++RefMultiselectComponent.seq}`;

  /** Id selezionati; `['*']` = tutti. */
  readonly value = model<string[]>([]);
  readonly suggestions = input<RefOption[]>([]);
  readonly allowAll = input<boolean>(false);
  readonly placeholderKey = input<string>('RefSelect.Placeholder');

  protected readonly isAll = computed(() => this.value().length === 1 && this.value()[0] === REF_ALL);

  protected labelFor(id: string): string {
    const opt = this.suggestions().find((s) => s.id === id);
    return opt?.label ? `${id} — ${opt.label}` : id;
  }

  protected add(raw: string): void {
    const id = raw.trim();
    if (!id || id === REF_ALL) return;
    if (this.value().includes(id)) return;
    this.value.set([...this.value().filter((v) => v !== REF_ALL), id]);
  }

  protected remove(id: string): void {
    this.value.set(this.value().filter((v) => v !== id));
  }

  protected toggleAll(checked: boolean): void {
    this.value.set(checked ? [REF_ALL] : []);
  }
}
