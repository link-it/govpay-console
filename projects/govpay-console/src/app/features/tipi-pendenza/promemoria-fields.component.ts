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

import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { ReactiveFormsModule, type FormGroup } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusBadgeComponent, type StatusTone } from '@linkit/shared-ui';
import { CodeFieldComponent } from '@core/ui/code-field/code-field.component';
import { SelectComponent, type SelectOption } from '@core/ui/select/select.component';

/**
 * Blocco campi di un singolo promemoria di avvisatura (avviso / scadenza /
 * ricevuta), reso come card coerente con `lnk-template-unit`: intestazione con
 * badge del formato (derivato dal tipo), impostazioni (abilitato, preavviso,
 * allega PDF, solo eseguiti) e — quando è scelto un tipo — i template di
 * **oggetto** e **messaggio**. Senza tipo, i template mostrano lo stato vuoto.
 *
 * Riceve il `FormGroup` da editare; i campi opzionali (`allegaPdf`,
 * `soloEseguiti`, `preavviso`) sono resi solo se presenti nel gruppo.
 */
@Component({
  selector: 'lnk-promemoria-fields',
  standalone: true,
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe, StatusBadgeComponent, CodeFieldComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-xl border border-[var(--border)] overflow-hidden" [formGroup]="group()">
      <div class="flex items-center gap-3 px-4 py-3">
        <span class="shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-[var(--accent-light,var(--muted))] text-[var(--foreground)]">
          <ng-icon name="bootstrapBell" size="1rem" />
        </span>
        <div class="flex-1 min-w-0 text-sm font-semibold flex items-center gap-2 flex-wrap">
          <span>{{ titleKey() | translate }}</span>
          @if (badge(); as b) {
            <lnk-status-badge [tone]="b.tone" [labelKey]="b.labelKey" />
          }
        </div>
      </div>

      <div class="px-4 pb-4 space-y-3">
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
        <div class="flex flex-col gap-1 max-w-xs">
          <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.TipoTemplate' | translate }}</span>
          <lnk-select
            formControlName="tipo"
            [options]="tipoOptions"
            [placeholder]="'TipiPendenza.Config.Nessuno' | translate"
            [ariaLabel]="'TipiPendenza.Config.TipoTemplate' | translate"
          />
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

        @if (tipoValue()) {
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.Oggetto' | translate }}</span>
            <lnk-code-field formControlName="oggetto" format="auto" [rows]="4" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ 'TipiPendenza.Config.Messaggio' | translate }}</span>
            <lnk-code-field formControlName="messaggio" format="auto" [rows]="6" />
          </div>
        } @else {
          <div class="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] bg-[var(--card-bg)]">
            <ng-icon name="bootstrapInfoCircle" size="1.1rem" class="shrink-0" />
            <span>{{ 'TipiPendenza.Template.Vuoto' | translate }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class PromemoriaFieldsComponent {
  readonly group = input.required<FormGroup>();
  readonly titleKey = input.required<string>();

  /** Opzioni del tipo template (solo Freemarker). */
  readonly tipoOptions: SelectOption[] = [{ value: 'freemarker', label: 'Freemarker' }];

  readonly hasAllegaPdf = computed(() => !!this.group().get('allegaPdf'));
  readonly hasSoloEseguiti = computed(() => !!this.group().get('soloEseguiti'));
  readonly hasPreavviso = computed(() => !!this.group().get('preavviso'));

  /** Valore corrente del tipo, sincronizzato dal control. */
  protected readonly tipoValue = signal('');

  constructor() {
    effect((onCleanup) => {
      const tc = this.group().get('tipo');
      if (!tc) return;
      this.tipoValue.set(tc.value ?? '');
      const sub = tc.valueChanges.subscribe((v) => this.tipoValue.set(v ?? ''));
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly badge = computed<{ tone: StatusTone; labelKey: string } | null>(() =>
    this.tipoValue() ? { tone: 'warning', labelKey: 'TipiPendenza.Fmt.Freemarker' } : null
  );
}
