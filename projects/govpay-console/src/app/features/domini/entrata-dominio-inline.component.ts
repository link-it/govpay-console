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
import { NgTemplateOutlet } from '@angular/common';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, InfoGridComponent, RequiredLabelDirective, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { DominiConsoleApi } from './domini.console-api';
import { TIPI_CONTABILITA, type EntrataDominioCreate, type EntrataDominioReplace, type EntrataDominioSummary, type TipoContabilita } from './dominio.model';

const IBAN_PATTERN = /^[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{1,30}$/;

/** Card view/edit inline di una entrata del dominio (o form di creazione se `entrata` è null). */
@Component({
  selector: 'lnk-entrata-dominio-inline',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet, TranslatePipe, InfoGridComponent, InlineEditCardComponent, RequiredLabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './entrata-dominio-inline.component.html',
})
export class EntrataDominioInlineComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DominiConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idDominio = input.required<string>();
  readonly entrata = input<EntrataDominioSummary | null>(null);
  /** Suggerimenti (codice entrata globale) per la creazione. */
  readonly entrateSuggestions = input<{ id: string; label?: string }[]>([]);
  /** Suggerimenti IBAN (conti accredito del dominio). */
  readonly ibanSuggestions = input<string[]>([]);

  readonly saved = output<void>();
  readonly cancelCreate = output<void>();

  readonly tipiContabilita: TipoContabilita[] = TIPI_CONTABILITA;

  private etag: string | null = null;
  private loadedForEdit = false;

  readonly isCreate = computed(() => this.entrata() === null);
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly statusTone = computed<'success' | 'muted'>(() => (this.entrata()?.abilitato ? 'success' : 'muted'));
  readonly statusLabel = computed(() => this.translate.instant(this.entrata()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly form = this.fb.nonNullable.group({
    idEntrata: ['', [Validators.required, Validators.maxLength(255)]],
    abilitato: [true],
    ibanAccredito: ['', [Validators.pattern(IBAN_PATTERN)]],
    ibanAppoggio: ['', [Validators.pattern(IBAN_PATTERN)]],
    tipoContabilita: [''],
    codiceContabilita: [''],
  });

  readonly viewItems = computed<InfoGridItem[]>(() => {
    const e = this.entrata();
    if (!e) return [];
    return [
      { labelKey: 'Domini.EntrateDominio.IdEntrata', value: e.idEntrata, mono: true },
      { labelKey: 'Domini.EntrateDominio.Descrizione', value: e.descrizione, wide: true, hide: !e.descrizione },
      { labelKey: 'Domini.EntrateDominio.Abilitato', value: this.translate.instant(e.abilitato ? 'Common.Yes' : 'Common.No') },
    ];
  });

  constructor() {
    effect(() => {
      const e = this.entrata();
      if (e) {
        this.form.controls.idEntrata.disable();
        this.form.patchValue({ idEntrata: e.idEntrata, abilitato: e.abilitato }, { emitEvent: false });
      }
    });
    effect(() => {
      if (!this.isCreate() && this.editing() && !this.loadedForEdit) {
        this.loadedForEdit = true;
        this.fetchForEdit();
      }
    });
  }

  private fetchForEdit(): void {
    const e = this.entrata();
    if (!e) return;
    this.api
      .getEntrataWithETag(this.idDominio(), e.idEntrata)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (!res?.body) return;
        this.etag = res.etag;
        const b = res.body;
        this.form.patchValue(
          {
            abilitato: b.abilitato,
            ibanAccredito: b.ibanAccredito ?? '',
            ibanAppoggio: b.ibanAppoggio ?? '',
            tipoContabilita: b.tipoContabilita ?? '',
            codiceContabilita: b.codiceContabilita ?? '',
          },
          { emitEvent: false },
        );
      });
  }

  onCancel(): void {
    const e = this.entrata();
    if (e) this.form.patchValue({ abilitato: e.abilitato }, { emitEvent: false });
  }

  cancelCreation(): void {
    this.cancelCreate.emit();
  }

  private body(): EntrataDominioReplace {
    const r = this.form.getRawValue();
    const s = (v: string) => v.trim() || undefined;
    return {
      abilitato: r.abilitato,
      ibanAccredito: s(r.ibanAccredito),
      ibanAppoggio: s(r.ibanAppoggio),
      tipoContabilita: (s(r.tipoContabilita) as TipoContabilita | undefined) ?? undefined,
      codiceContabilita: s(r.codiceContabilita),
    };
  }

  save(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    if (this.isCreate()) {
      const create: EntrataDominioCreate = { idEntrata: this.form.getRawValue().idEntrata, ...this.body() };
      this.api
        .createEntrata(this.idDominio(), create)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Domini.EntrateDominio.Creata'));
          this.saved.emit();
        });
    } else {
      this.api
        .replaceEntrata(this.idDominio(), this.entrata()!.idEntrata, this.body(), this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.etag = res.etag;
          this.loadedForEdit = false;
          this.snackbar.success(this.translate.instant('Domini.EntrateDominio.Aggiornata'));
          this.editing.set(false);
          this.saved.emit();
        });
    }
  }

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let key = 'Domini.EntrateDominio.SalvaErrore';
    if (!isEdit && err.status === 409) key = 'Domini.EntrateDominio.ConflittoId';
    else if (err.status === 422) key = 'Domini.EntrateDominio.Invalido';
    else if (isEdit && (err.status === 412 || err.status === 428)) key = 'Domini.Form.ConflittoConcorrenza';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
