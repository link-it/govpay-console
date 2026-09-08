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
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { RicevuteConsoleApi } from './ricevute.console-api';
import type { Ricevuta } from './ricevuta.model';

/**
 * Card inline per il caricamento di una RT (`POST /ricevute` multipart). Un solo
 * campo `file` (XML o JSON pagoPA): il formato è riconosciuto dal contenuto, non
 * dall'estensione. Emette `uploaded` (dettaglio acquisito) a esito positivo.
 */
@Component({
  selector: 'lnk-ricevuta-upload',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ricevuta-upload.component.html',
})
export class RicevutaUploadComponent {
  private readonly api = inject(RicevuteConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly uploaded = output<Ricevuta>();
  readonly cancel = output<void>();

  readonly file = signal<File | null>(null);
  readonly submitting = signal(false);

  readonly canSubmit = computed(() => !!this.file() && !this.submitting());

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  submit(): void {
    const file = this.file();
    if (!file || !this.canSubmit()) return;
    this.submitting.set(true);
    this.api
      .upload(file)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Ricevute.Upload.Errore')));
          return of(null);
        })
      )
      .subscribe((ricevuta) => {
        this.submitting.set(false);
        if (!ricevuta) return;
        this.snackbar.success(this.translate.instant('Ricevute.Upload.Successo'));
        this.uploaded.emit(ricevuta);
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
