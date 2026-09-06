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
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Campo **segreto** (password/API key/…) come `ControlValueAccessor`, con:
 *
 * - **anti-autofill**: `autocomplete="one-time-code"` (Chrome non aggancia il
 *   password manager, niente menu "suggerisci password"), hint proprietari per
 *   1Password/LastPass/Bitwarden e il trick `readonly` finché il campo non
 *   riceve il focus (blocca il precompilamento al load su tutti i browser);
 * - **mostra/nascondi**: bottone occhio che alterna `type` password/text.
 *
 * Uso: `<lnk-secret-input formControlName="password" [ariaLabel]="…" />`.
 */
@Component({
  selector: 'lnk-secret-input',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SecretInputComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative">
      <input
        [type]="visible() ? 'text' : 'password'"
        [value]="value()"
        [disabled]="disabled()"
        [readonly]="guard()"
        [attr.placeholder]="placeholder() || null"
        [attr.aria-label]="ariaLabel() || null"
        autocomplete="one-time-code"
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
        (focus)="guard.set(false)"
        (blur)="onTouched()"
        (input)="onInput($event)"
        class="w-full px-3 py-2 pr-10 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      <button
        type="button"
        tabindex="-1"
        (click)="toggle()"
        [attr.aria-label]="(visible() ? 'Auth.HidePassword' : 'Auth.ShowPassword') | translate"
        [attr.aria-pressed]="visible()"
        [title]="(visible() ? 'Auth.HidePassword' : 'Auth.ShowPassword') | translate"
        class="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus:outline-none rounded-r"
      >
        <ng-icon [name]="visible() ? 'bootstrapEyeSlash' : 'bootstrapEye'" size="1.05rem" />
      </button>
    </div>
  `,
})
export class SecretInputComponent implements ControlValueAccessor {
  readonly ariaLabel = input('');
  readonly placeholder = input('');

  readonly value = signal('');
  readonly visible = signal(false);
  readonly disabled = signal(false);
  /** `readonly` finché il campo non riceve il focus (anti-autofill al load). */
  readonly guard = signal(true);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  toggle(): void {
    this.visible.update((v) => !v);
  }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: unknown): void {
    this.value.set(v == null ? '' : String(v));
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
