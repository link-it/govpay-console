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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SelectComponent, type LnkSelectOption } from '@linkit/shared-ui';
import { AuthService } from '@core/auth/services/auth.service';
import { problemDetail } from '@core/models';
import { TracciatiConsoleApi } from './tracciati.console-api';
import type { FormatoTracciato } from './tracciato.model';

/**
 * Card inline per l'upload di un tracciato pendenze (`POST /pendenze/tracciati`
 * multipart). Il formato è desunto dall'estensione, ma per i CSV serve
 * `idDominio`. Emette `uploaded` (con l'id creato) a esito positivo.
 */
@Component({
  selector: 'lnk-tracciato-upload',
  standalone: true,
  imports: [NgIcon, TranslatePipe, FormsModule, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracciato-upload.component.html',
})
export class TracciatoUploadComponent {
  private readonly api = inject(TracciatiConsoleApi);
  private readonly auth = inject(AuthService);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly uploaded = output<number>();
  readonly cancel = output<void>();

  readonly file = signal<File | null>(null);
  readonly idDominio = signal<string>('');
  readonly submitting = signal(false);

  /** Domini in scope dell'utente (escluso il placeholder `*`). */
  readonly domini = computed(() =>
    (this.auth.user()?.domini ?? []).filter((d) => d.idDominio && d.idDominio !== '*')
  );
  /** Opzioni del select dominio (value = idDominio, label = ragioneSociale). */
  readonly dominioOptions = computed<LnkSelectOption[]>(() =>
    this.domini().map((d) => ({ value: d.idDominio, label: d.ragioneSociale || d.idDominio }))
  );

  /** Formato desunto dall'estensione del file selezionato. */
  readonly formato = computed<FormatoTracciato | null>(() => {
    const name = this.file()?.name?.toLowerCase() ?? '';
    if (name.endsWith('.csv')) return 'CSV';
    if (name.endsWith('.json')) return 'JSON';
    return null;
  });

  /** CSV richiede `idDominio`; JSON può ometterlo (ogni riga dichiara il dominio). */
  readonly dominioRequired = computed(() => this.formato() === 'CSV');

  readonly canSubmit = computed(() =>
    !!this.file() && !this.submitting() && (!this.dominioRequired() || !!this.idDominio())
  );

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  submit(): void {
    const file = this.file();
    if (!file || !this.canSubmit()) return;
    this.submitting.set(true);
    this.api
      .upload(file, {
        idDominio: this.idDominio() || undefined,
        formato: this.formato() ?? undefined,
      })
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Tracciati.Upload.Errore')));
          return of(null);
        })
      )
      .subscribe((tracciato) => {
        this.submitting.set(false);
        if (!tracciato) return;
        this.snackbar.success(this.translate.instant('Tracciati.Upload.Successo'));
        this.uploaded.emit(tracciato.id);
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
