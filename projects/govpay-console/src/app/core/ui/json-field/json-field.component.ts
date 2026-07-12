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

import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, type ControlValueAccessor, type ValidationErrors, type Validator } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Campo per l'editing di un valore **JSON** (oggetto opaco) tramite textarea con
 * validazione di sintassi + pulsante "carica da file". Il valore del form control
 * è l'**oggetto** già parsato (o `null` se vuoto); il testo mostrato è il JSON
 * indentato. In caso di JSON non valido il control espone l'errore `{ json: true }`.
 *
 * ```html
 * <lnk-json-field formControlName="definizione" [rows]="8" />
 * ```
 */
@Component({
  selector: 'lnk-json-field',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-1">
      <textarea
        [rows]="rows()"
        [value]="text()"
        [disabled]="disabled()"
        [attr.placeholder]="placeholder()"
        spellcheck="false"
        class="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        [class.border-[var(--status-danger-text)]]="invalid()"
        (input)="onInput($any($event.target).value)"
        (blur)="onBlur()"
      ></textarea>
      <div class="flex items-center gap-3">
        <label class="btn btn-ghost btn-sm" [class.opacity-60]="disabled()">
          <span>{{ 'JsonField.Carica' | translate }}</span>
          <input type="file" class="hidden" accept="application/json,.json,.txt,.ftl" [disabled]="disabled()" (change)="onFile($event)" />
        </label>
        @if (text()) {
          <button type="button" class="btn btn-ghost btn-sm" [disabled]="disabled()" (click)="clear()">{{ 'JsonField.Svuota' | translate }}</button>
        }
        @if (invalid()) {
          <span class="text-xs text-[var(--status-danger-text)]">{{ 'JsonField.NonValido' | translate }}</span>
        }
      </div>
    </div>
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JsonFieldComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => JsonFieldComponent), multi: true },
  ],
})
export class JsonFieldComponent implements ControlValueAccessor, Validator {
  readonly rows = input(6);
  readonly placeholder = input('');

  protected readonly text = signal('');
  protected readonly invalid = signal(false);
  protected readonly disabled = signal(false);

  private onChange: (v: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: unknown): void {
    this.text.set(v == null || v === '' ? '' : JSON.stringify(v, null, 2));
    this.invalid.set(false);
  }
  registerOnChange(fn: (v: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }

  validate(): ValidationErrors | null {
    return this.invalid() ? { json: true } : null;
  }

  protected onInput(value: string): void {
    this.text.set(value);
    const { value: parsed, error } = this.parse(value);
    this.invalid.set(error);
    this.onChange(error ? null : parsed);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected clear(): void {
    this.text.set('');
    this.invalid.set(false);
    this.onChange(null);
    this.onTouched();
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      // Pretty-print se è JSON valido, altrimenti lascia il contenuto grezzo.
      let text = content;
      try {
        text = JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        /* contenuto non-JSON: mostrato grezzo, la validazione segnalerà l'errore */
      }
      this.onInput(text);
    };
    reader.readAsText(file);
  }

  /** Parsa il testo: vuoto → null (valido); JSON valido → oggetto; altrimenti errore. */
  private parse(text: string): { value: unknown; error: boolean } {
    const t = text.trim();
    if (!t) return { value: null, error: false };
    try {
      return { value: JSON.parse(t), error: false };
    } catch {
      return { value: null, error: true };
    }
  }
}
