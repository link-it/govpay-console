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

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import type { DominioSummary } from '@core/models';
import { problemDetail } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { IntermediariConsoleApi } from './intermediari.console-api';
import type { StazioneCreate, StazioneReplace, StazioneSummary, VersioneStazione } from './intermediario.model';

const ID_PATTERN = /^[a-zA-Z0-9\-_]{1,35}$/;

/**
 * Card di **visualizzazione e modifica inline** di una stazione (o form di
 * creazione quando `stazione` è `null`). In modifica carica lazily `ETag` e
 * domini via `getStazioneWithETag`. Emette `saved` (create/update ok) o
 * `cancelCreate` (annulla creazione) per far aggiornare la lista al parent.
 */
@Component({
  selector: 'lnk-stazione-inline',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, InlineEditCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './stazione-inline.component.html',
})
export class StazioneInlineComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(IntermediariConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idIntermediario = input.required<string>();
  /** Stazione esistente (modifica) o `null` (creazione). */
  readonly stazione = input<StazioneSummary | null>(null);

  readonly saved = output<void>();
  readonly cancelCreate = output<void>();

  private etag: string | null = null;
  private loadedForEdit = false;

  readonly isCreate = computed(() => this.stazione() === null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly domini = signal<DominioSummary[]>([]);
  readonly versioni: VersioneStazione[] = ['V1', 'V2'];

  readonly form = this.fb.nonNullable.group({
    idStazione: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    versione: ['V2' as VersioneStazione, [Validators.required]],
    abilitato: [true],
  });

  constructor() {
    // Init dei valori dal summary (modifica) o pulizia (creazione).
    effect(() => {
      const s = this.stazione();
      if (s) {
        this.form.controls.idStazione.disable();
        this.form.patchValue({ idStazione: s.idStazione, versione: s.versione, abilitato: s.abilitato }, { emitEvent: false });
      }
    });
    // In modifica: al primo passaggio in edit, carica ETag + domini.
    effect(() => {
      if (!this.isCreate() && this.editing() && !this.loadedForEdit) {
        this.loadedForEdit = true;
        this.fetchForEdit();
      }
    });
  }

  private fetchForEdit(): void {
    const s = this.stazione();
    if (!s) return;
    this.api
      .getStazioneWithETag(this.idIntermediario(), s.idStazione)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (!res?.body) return;
        this.etag = res.etag;
        this.domini.set(res.body.domini ?? []);
        this.form.patchValue({ versione: res.body.versione, abilitato: res.body.abilitato }, { emitEvent: false });
      });
  }

  onCancel(): void {
    const s = this.stazione();
    if (s) this.form.patchValue({ versione: s.versione, abilitato: s.abilitato }, { emitEvent: false });
  }

  cancelCreation(): void {
    this.cancelCreate.emit();
  }

  save(): void {
    if (this.saving()) return;
    if (this.isCreate() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.isCreate()) {
      const body: StazioneCreate = { idStazione: raw.idStazione, versione: raw.versione, abilitato: raw.abilitato };
      this.api
        .createStazione(this.idIntermediario(), body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Intermediari.Stazioni.Form.Creata'));
          this.saved.emit();
        });
    } else {
      const body: StazioneReplace = { versione: raw.versione, abilitato: raw.abilitato };
      this.api
        .replaceStazione(this.idIntermediario(), this.stazione()!.idStazione, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          // Il PUT restituisce la versione aggiornata: rinfresca l'ETag per la
          // prossima modifica ed evita il 412 (If-Match ormai obsoleto). Se per
          // qualche motivo l'header manca, forza il refetch al prossimo edit.
          this.etag = res.etag;
          this.loadedForEdit = false;
          this.snackbar.success(this.translate.instant('Intermediari.Stazioni.Form.Aggiornata'));
          this.editing.set(false);
          this.saved.emit();
        });
    }
  }

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let key = 'Intermediari.Form.SalvaErrore';
    if (!isEdit && err.status === 409) key = 'Intermediari.Form.ConflittoId';
    else if (!isEdit && err.status === 422) key = 'Intermediari.Stazioni.Form.IdNonValido';
    else if (isEdit && (err.status === 412 || err.status === 428)) key = 'Intermediari.Form.ConflittoConcorrenza';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
