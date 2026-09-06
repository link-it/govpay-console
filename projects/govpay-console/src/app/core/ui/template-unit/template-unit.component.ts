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
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusBadgeComponent, type StatusTone, SelectComponent } from '@linkit/shared-ui';
import { CodeFieldComponent, type CodeFieldFormat } from '@core/ui/code-field/code-field.component';
/** Opzione del selettore "tipo" con il formato che ne deriva. */
export interface TemplateTipoOption {
  value: string;
  /** Etichetta mostrata (testo grezzo, es. `angular2-json-schema-form`). */
  label: string;
  /** Formato del template per quel tipo. */
  format: 'json' | 'freemarker';
}

/**
 * Unità "tipo → template" della maschera tipi pendenza. Raggruppa in un
 * riquadro: intestazione con scopo e **badge del formato**, un eventuale
 * selettore **tipo** che pilota formato/stato, e l'editor `lnk-code-field`
 * (drag & drop, carica, reset, mostra/nascondi).
 *
 * Copre due situazioni:
 * - **tipo-driven** (es. definizione, trasformazione): passa `tipo` +
 *   `tipoOptions`; senza tipo selezionato mostra lo stato vuoto.
 * - **standalone** (es. impaginazione, validazione): passa `fixedFormat`.
 *
 * Con `content` assente lavora in **modalità gruppo**: gli editor sono
 * proiettati dal padre via `<ng-content>` (un tipo, più template).
 */
@Component({
  selector: 'lnk-template-unit',
  standalone: true,
  imports: [ReactiveFormsModule, NgIcon, TranslatePipe, StatusBadgeComponent, CodeFieldComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-xl border border-[var(--border)] overflow-hidden" [class.lnk-tu--off]="off()">
      <!-- Intestazione: icona · titolo + badge · scopo -->
      <div class="flex items-center gap-3 px-4 py-3">
        <span class="shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-[var(--accent-light,var(--muted))] text-[var(--foreground)]">
          <ng-icon [name]="icon()" size="1rem" />
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap text-sm font-semibold">
            <span>{{ titleKey() | translate }}</span>
            @if (badge(); as b) {
              <lnk-status-badge [tone]="b.tone" [labelKey]="b.labelKey" />
            }
          </div>
          @if (purposeKey()) {
            <div class="text-xs text-[var(--muted-foreground)] mt-0.5">{{ purposeKey()! | translate }}</div>
          }
        </div>
      </div>

      <!-- Selettore tipo (solo unità tipo-driven) -->
      @if (tipo(); as tc) {
        <div class="flex items-center gap-3 px-4 pb-3">
          <span class="text-xs font-medium text-[var(--muted-foreground)]">{{ tipoLabelKey() | translate }}</span>
          <lnk-select
            [formControl]="tc"
            [options]="tipoOptions()"
            [placeholder]="'TipiPendenza.Config.Nessuno' | translate"
            [ariaLabel]="tipoLabelKey() | translate"
          />
        </div>
      }

      @if (off()) {
        <!-- Stato vuoto: nessun tipo scelto -->
        <div class="flex items-center gap-3 mx-3 mb-3 px-4 py-4 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] bg-[var(--card-bg)]">
          <ng-icon name="bootstrapInfoCircle" size="1.1rem" class="shrink-0" />
          <span>{{ 'TipiPendenza.Template.Vuoto' | translate }}</span>
        </div>
      } @else if (content(); as cc) {
        <!-- Editor singolo -->
        <div class="px-3 pb-3">
          <lnk-code-field [formControl]="cc" [format]="codeFormat()" [rows]="rows()" />
        </div>
      } @else {
        <!-- Modalità gruppo: editor proiettati dal padre (un tipo, più template) -->
        <div class="px-4 pb-4 space-y-4">
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class TemplateUnitComponent {
  readonly titleKey = input.required<string>();
  readonly purposeKey = input<string>();
  readonly icon = input('bootstrapFileEarmarkCode');
  /** Control dell'editor (modalità singola). Se assente, il contenuto è
   *  proiettato dal padre via `<ng-content>` (modalità gruppo). */
  readonly content = input<FormControl | null>(null);
  readonly codeFormat = input<CodeFieldFormat>('auto');
  readonly rows = input(6);

  /** Control del selettore tipo. Se assente, l'unità è standalone. */
  readonly tipo = input<FormControl | null>(null);
  readonly tipoOptions = input<TemplateTipoOption[]>([]);
  readonly tipoLabelKey = input('TipiPendenza.Template.Tipo');

  /** Formato per le unità standalone (senza tipo). */
  readonly fixedFormat = input<'json' | 'freemarker' | null>(null);

  /** Valore corrente del tipo, sincronizzato dal control. */
  private readonly tipoValue = signal('');

  constructor() {
    effect((onCleanup) => {
      const tc = this.tipo();
      if (!tc) return;
      this.tipoValue.set(tc.value ?? '');
      const sub = tc.valueChanges.subscribe((v) => this.tipoValue.set(v ?? ''));
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** Formato effettivo: dal tipo scelto o quello fisso. */
  private readonly format = computed<'json' | 'freemarker' | null>(() => {
    const tc = this.tipo();
    if (tc) {
      const opt = this.tipoOptions().find((o) => o.value === this.tipoValue());
      return opt?.format ?? null;
    }
    return this.fixedFormat();
  });

  /** True quando l'unità è tipo-driven ma nessun tipo è selezionato. */
  readonly off = computed(() => this.tipo() != null && !this.tipoValue());

  readonly badge = computed<{ tone: StatusTone; labelKey: string } | null>(() => {
    switch (this.format()) {
      case 'json':
        return { tone: 'info', labelKey: 'TipiPendenza.Fmt.Json' };
      case 'freemarker':
        return { tone: 'warning', labelKey: 'TipiPendenza.Fmt.Freemarker' };
      default:
        return null;
    }
  });
}
