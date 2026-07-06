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
import { SnackbarService, InfoGridComponent, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { RequiredLabelDirective } from '@linkit/shared-ui';
import { DominiConsoleApi } from './domini.console-api';
import type { UnitaOperativaCreate, UnitaOperativaReplace, UnitaOperativaSummary } from './dominio.model';

const ID_PATTERN = /^.{1,35}$/;

/** Card view/edit inline di una unità operativa (o form di creazione se `uo` è null). */
@Component({
  selector: 'lnk-unita-operativa-inline',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet, TranslatePipe, InfoGridComponent, InlineEditCardComponent, RequiredLabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './unita-operativa-inline.component.html',
})
export class UnitaOperativaInlineComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DominiConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idDominio = input.required<string>();
  readonly uo = input<UnitaOperativaSummary | null>(null);

  readonly saved = output<void>();
  readonly cancelCreate = output<void>();

  private etag: string | null = null;
  private loadedForEdit = false;

  readonly isCreate = computed(() => this.uo() === null);
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly statusTone = computed<'success' | 'muted'>(() => (this.uo()?.abilitato ? 'success' : 'muted'));
  readonly statusLabel = computed(() => this.translate.instant(this.uo()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly form = this.fb.nonNullable.group({
    idUnitaOperativa: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    ragioneSociale: ['', [Validators.required, Validators.maxLength(70)]],
    abilitato: [true],
    indirizzo: [''],
    civico: [''],
    cap: [''],
    localita: [''],
    provincia: [''],
    nazione: [''],
    email: [''],
    pec: [''],
    tel: [''],
    web: [''],
    area: [''],
  });

  readonly viewItems = computed<InfoGridItem[]>(() => {
    const u = this.uo();
    if (!u) return [];
    return [
      { labelKey: 'Domini.UnitaOperative.Id', value: u.idUnitaOperativa, mono: true },
      { labelKey: 'Domini.UnitaOperative.RagioneSociale', value: u.ragioneSociale, wide: true },
      { labelKey: 'Domini.UnitaOperative.Abilitato', value: this.translate.instant(u.abilitato ? 'Common.Yes' : 'Common.No') },
    ];
  });

  constructor() {
    effect(() => {
      const u = this.uo();
      if (u) {
        this.form.controls.idUnitaOperativa.disable();
        this.form.patchValue({ idUnitaOperativa: u.idUnitaOperativa, ragioneSociale: u.ragioneSociale, abilitato: u.abilitato ?? true }, { emitEvent: false });
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
    const u = this.uo();
    if (!u) return;
    this.api
      .getUnitaOperativaWithETag(this.idDominio(), u.idUnitaOperativa)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (!res?.body) return;
        this.etag = res.etag;
        const b = res.body;
        this.form.patchValue(
          {
            ragioneSociale: b.ragioneSociale,
            abilitato: b.abilitato,
            indirizzo: b.indirizzo ?? '',
            civico: b.civico ?? '',
            cap: b.cap ?? '',
            localita: b.localita ?? '',
            provincia: b.provincia ?? '',
            nazione: b.nazione ?? '',
            email: b.email ?? '',
            pec: b.pec ?? '',
            tel: b.tel ?? '',
            web: b.web ?? '',
            area: b.area ?? '',
          },
          { emitEvent: false },
        );
      });
  }

  onCancel(): void {
    const u = this.uo();
    if (u) this.form.patchValue({ ragioneSociale: u.ragioneSociale, abilitato: u.abilitato ?? true }, { emitEvent: false });
  }

  cancelCreation(): void {
    this.cancelCreate.emit();
  }

  private body(): UnitaOperativaReplace {
    const r = this.form.getRawValue();
    const s = (v: string) => v.trim() || undefined;
    return {
      ragioneSociale: r.ragioneSociale,
      abilitato: r.abilitato,
      indirizzo: s(r.indirizzo),
      civico: s(r.civico),
      cap: s(r.cap),
      localita: s(r.localita),
      provincia: s(r.provincia),
      nazione: s(r.nazione),
      email: s(r.email),
      pec: s(r.pec),
      tel: s(r.tel),
      web: s(r.web),
      area: s(r.area),
    };
  }

  save(): void {
    if (this.saving()) return;
    if (this.isCreate() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    if (this.isCreate()) {
      const create: UnitaOperativaCreate = { idUnitaOperativa: this.form.getRawValue().idUnitaOperativa, ...this.body() };
      this.api
        .createUnitaOperativa(this.idDominio(), create)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Domini.UnitaOperative.Creata'));
          this.saved.emit();
        });
    } else {
      this.api
        .replaceUnitaOperativa(this.idDominio(), this.uo()!.idUnitaOperativa, this.body(), this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.etag = res.etag;
          this.loadedForEdit = false;
          this.snackbar.success(this.translate.instant('Domini.UnitaOperative.Aggiornata'));
          this.editing.set(false);
          this.saved.emit();
        });
    }
  }

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let key = 'Domini.UnitaOperative.SalvaErrore';
    if (!isEdit && err.status === 409) key = 'Domini.UnitaOperative.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) key = 'Domini.Form.ConflittoConcorrenza';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
