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

import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, of, type Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';

/**
 * Policy password allineata alla validazione server-side (schema
 * `RichiestaCambioPassword`): 8-255 caratteri, almeno una minuscola, una
 * maiuscola e una cifra, nessuno spazio.
 */
function passwordPolicy(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '');
  if (!v) return null; // `required` gestisce il vuoto
  const ok =
    v.length >= 8 &&
    v.length <= 255 &&
    /[a-z]/.test(v) &&
    /[A-Z]/.test(v) &&
    /[0-9]/.test(v) &&
    !/\s/.test(v);
  return ok ? null : { policy: true };
}

/**
 * Card write-only per l'impostazione di una password (utenza applicazione o
 * operatore). La PUT effettiva è iniettata via `submit`, così il componente
 * resta disaccoppiato dai client specifici. La password non è mai mostrata.
 */
@Component({
  selector: 'lnk-set-password-card',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './set-password-card.component.html',
})
export class SetPasswordCardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  /** Funzione che esegue la PUT write-only della nuova password (204). */
  readonly submit = input.required<(nuovaPassword: string) => Observable<void>>();
  /** Chiave i18n del titolo/bottone di apertura. */
  readonly titleKey = input('Password.Imposta');

  readonly open = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nuovaPassword: ['', [Validators.required, Validators.maxLength(255), passwordPolicy]],
      conferma: ['', [Validators.required]],
    },
    {
      validators: (g: AbstractControl): ValidationErrors | null =>
        g.get('nuovaPassword')!.value === g.get('conferma')!.value ? null : { mismatch: true },
    },
  );

  toggle(open: boolean): void {
    this.open.set(open);
    if (!open) this.form.reset();
  }

  save(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.submit()(this.form.getRawValue().nuovaPassword)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.saving.set(false);
          const key = err.status === 403 ? 'Password.SenzaDiritti' : 'Password.Errore';
          this.snackbar.error(problemDetail(err, this.translate.instant(key)));
          return of(null);
        }),
      )
      .subscribe((res) => {
        this.saving.set(false);
        if (res === null) return;
        this.snackbar.success(this.translate.instant('Password.Aggiornata'));
        this.toggle(false);
      });
  }
}
