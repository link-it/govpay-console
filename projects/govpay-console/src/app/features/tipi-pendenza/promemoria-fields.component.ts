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
import { ReactiveFormsModule, type FormGroup } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CodeFieldComponent } from '@core/ui/code-field/code-field.component';

/**
 * Blocco campi di un singolo promemoria di avvisatura (avviso / scadenza /
 * ricevuta). Riceve il `FormGroup` da editare; i campi opzionali
 * (`allegaPdf`, `soloEseguiti`, `preavviso`) sono resi solo se il gruppo
 * contiene il relativo control.
 */
@Component({
  selector: 'lnk-promemoria-fields',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, CodeFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-3" [formGroup]="group()">
      <div class="text-sm font-semibold">{{ titleKey() | translate }}</div>
      <label class="flex items-center gap-2">
        <input type="checkbox" formControlName="abilitato" class="h-4 w-4 accent-[var(--primary)]" />
        <span class="text-sm">{{ 'TipiPendenza.Config.Abilitato' | translate }}</span>
      </label>
      @if (hasPreavviso()) {
        <label class="flex flex-col gap-1 max-w-xs">
          <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.Preavviso' | translate }}</span>
          <input type="number" min="0" formControlName="preavviso" class="px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </label>
      }
      <label class="flex flex-col gap-1 max-w-xs">
        <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.TipoTemplate' | translate }}</span>
        <select formControlName="tipo" class="px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
          <option value="">{{ 'TipiPendenza.Config.Nessuno' | translate }}</option>
          <option value="freemarker">Freemarker</option>
        </select>
      </label>
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.Oggetto' | translate }}</span>
        <lnk-code-field formControlName="oggetto" format="auto" [rows]="4" />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.Messaggio' | translate }}</span>
        <lnk-code-field formControlName="messaggio" format="auto" [rows]="6" />
      </div>
      @if (hasAllegaPdf()) {
        <label class="flex items-center gap-2">
          <input type="checkbox" formControlName="allegaPdf" class="h-4 w-4 accent-[var(--primary)]" />
          <span class="text-sm">{{ 'TipiPendenza.Config.AllegaPdf' | translate }}</span>
        </label>
      }
      @if (hasSoloEseguiti()) {
        <label class="flex items-center gap-2">
          <input type="checkbox" formControlName="soloEseguiti" class="h-4 w-4 accent-[var(--primary)]" />
          <span class="text-sm">{{ 'TipiPendenza.Config.SoloEseguiti' | translate }}</span>
        </label>
      }
    </div>
  `,
})
export class PromemoriaFieldsComponent {
  readonly group = input.required<FormGroup>();
  readonly titleKey = input.required<string>();

  readonly hasAllegaPdf = computed(() => !!this.group().get('allegaPdf'));
  readonly hasSoloEseguiti = computed(() => !!this.group().get('soloEseguiti'));
  readonly hasPreavviso = computed(() => !!this.group().get('preavviso'));
}
