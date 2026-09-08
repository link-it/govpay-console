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
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { RicevuteConsoleApi } from './ricevute.console-api';
import type { RecuperoRicevutaEsito } from './ricevuta.model';

/**
 * Card inline per il recupero puntuale di una RT mancante
 * (`POST /ricevute/recuperi`). Nessun file: solo la tripla
 * `(idDominio, iuv, idRicevuta)` che innesca il recupero da pagoPA lato batch.
 * Emette `recuperata` con l'esito (sincrono `201` o accodato `202`).
 */
@Component({
  selector: 'lnk-ricevuta-recupero',
  standalone: true,
  imports: [NgIcon, TranslatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ricevuta-recupero.component.html',
})
export class RicevutaRecuperoComponent {
  private readonly api = inject(RicevuteConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly recuperata = output<RecuperoRicevutaEsito>();
  readonly cancel = output<void>();

  readonly idDominio = signal<string>('');
  readonly iuv = signal<string>('');
  readonly idRicevuta = signal<string>('');
  readonly submitting = signal(false);

  /** `idDominio` = codice fiscale ente a 11 cifre. */
  readonly dominioValido = computed(() => /^[0-9]{11}$/.test(this.idDominio().trim()));

  readonly canSubmit = computed(
    () => this.dominioValido() && !!this.iuv().trim() && !!this.idRicevuta().trim() && !this.submitting()
  );

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.api
      .recupera({
        idDominio: this.idDominio().trim(),
        iuv: this.iuv().trim(),
        idRicevuta: this.idRicevuta().trim(),
      })
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Ricevute.Recupero.Errore')));
          return of(null);
        })
      )
      .subscribe((esito) => {
        this.submitting.set(false);
        if (!esito) return;
        if (esito.accodato) {
          this.snackbar.info(this.translate.instant('Ricevute.Recupero.Accodato'));
        } else {
          this.snackbar.success(this.translate.instant('Ricevute.Recupero.Successo'));
        }
        this.recuperata.emit(esito);
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
