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
import type { ContoAccredito, ContoAccreditoCreate, ContoAccreditoReplace, ContoAccreditoSummary } from './dominio.model';

const IBAN_PATTERN = /^.{1,35}$/;

/** Card view/edit inline di un conto di accredito (o form di creazione se `conto` è null). */
@Component({
  selector: 'lnk-conto-accredito-inline',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet, TranslatePipe, InfoGridComponent, InlineEditCardComponent, RequiredLabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './conto-accredito-inline.component.html',
})
export class ContoAccreditoInlineComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DominiConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idDominio = input.required<string>();
  readonly conto = input<ContoAccreditoSummary | null>(null);

  readonly saved = output<void>();
  readonly cancelCreate = output<void>();

  private etag: string | null = null;
  private loaded = false;

  /** Dettaglio completo (bic/intestatario/autStampa/postale): caricato per vista + edit. */
  readonly detail = signal<ContoAccredito | null>(null);

  readonly isCreate = computed(() => this.conto() === null);
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly statusTone = computed<'success' | 'muted'>(() => (this.conto()?.abilitato ? 'success' : 'muted'));
  readonly statusLabel = computed(() => this.translate.instant(this.conto()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly form = this.fb.nonNullable.group({
    ibanAccredito: ['', [Validators.required, Validators.pattern(IBAN_PATTERN)]],
    descrizione: [''],
    intestatario: [''],
    bic: [''],
    postale: [false],
    abilitato: [true],
    autStampaPosteItaliane: [''],
  });

  readonly viewItems = computed<InfoGridItem[]>(() => {
    const c = this.conto();
    if (!c) return [];
    const d = this.detail();
    const yesno = (v: boolean | undefined) => this.translate.instant(v ? 'Common.Yes' : 'Common.No');
    const descrizione = d?.descrizione ?? c.descrizione;
    return [
      { labelKey: 'Domini.ContiAccredito.Iban', value: c.ibanAccredito, mono: true, wide: true },
      { labelKey: 'Domini.ContiAccredito.Descrizione', value: descrizione, hide: !descrizione },
      { labelKey: 'Domini.ContiAccredito.Intestatario', value: d?.intestatario, hide: !d?.intestatario },
      { labelKey: 'Domini.ContiAccredito.Bic', value: d?.bic, mono: true, hide: !d?.bic },
      { labelKey: 'Domini.ContiAccredito.AutStampaPosteItaliane', value: d?.autStampaPosteItaliane, hide: !d?.autStampaPosteItaliane },
      { labelKey: 'Domini.ContiAccredito.Postale', value: yesno(d?.postale), hide: !d },
      { labelKey: 'Domini.ContiAccredito.Abilitato', value: yesno(c.abilitato) },
    ];
  });

  constructor() {
    effect(() => {
      const c = this.conto();
      if (c) {
        this.form.controls.ibanAccredito.disable();
        this.form.patchValue({ ibanAccredito: c.ibanAccredito, descrizione: c.descrizione ?? '', abilitato: c.abilitato ?? true }, { emitEvent: false });
      }
    });
    // Carica una volta il dettaglio completo: serve sia alla vista sia alla modifica.
    effect(() => {
      if (!this.isCreate() && !this.loaded) {
        this.loaded = true;
        this.fetchDetail();
      }
    });
  }

  private fetchDetail(): void {
    const c = this.conto();
    if (!c) return;
    this.api
      .getContoAccreditoWithETag(this.idDominio(), c.ibanAccredito)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (!res?.body) return;
        this.etag = res.etag;
        this.detail.set(res.body);
        this.patchFormFromDetail(res.body);
      });
  }

  private patchFormFromDetail(b: ContoAccredito): void {
    this.form.patchValue(
      {
        descrizione: b.descrizione ?? '',
        intestatario: b.intestatario ?? '',
        bic: b.bic ?? '',
        postale: b.postale ?? false,
        abilitato: b.abilitato,
        autStampaPosteItaliane: b.autStampaPosteItaliane ?? '',
      },
      { emitEvent: false },
    );
  }

  onCancel(): void {
    const d = this.detail();
    if (d) this.patchFormFromDetail(d);
  }

  cancelCreation(): void {
    this.cancelCreate.emit();
  }

  private body(): ContoAccreditoReplace {
    const r = this.form.getRawValue();
    const s = (v: string) => v.trim() || undefined;
    return {
      postale: r.postale,
      abilitato: r.abilitato,
      descrizione: s(r.descrizione),
      intestatario: s(r.intestatario),
      bic: s(r.bic),
      autStampaPosteItaliane: s(r.autStampaPosteItaliane),
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
      const create: ContoAccreditoCreate = { ibanAccredito: this.form.getRawValue().ibanAccredito, ...this.body() };
      this.api
        .createContoAccredito(this.idDominio(), create)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Domini.ContiAccredito.Creato'));
          this.saved.emit();
        });
    } else {
      this.api
        .replaceContoAccredito(this.idDominio(), this.conto()!.ibanAccredito, this.body(), this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.etag = res.etag;
          this.detail.set(res.body);
          this.snackbar.success(this.translate.instant('Domini.ContiAccredito.Aggiornato'));
          this.editing.set(false);
          this.saved.emit();
        });
    }
  }

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let key = 'Domini.ContiAccredito.SalvaErrore';
    if (!isEdit && err.status === 409) key = 'Domini.ContiAccredito.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) key = 'Domini.Form.ConflittoConcorrenza';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
