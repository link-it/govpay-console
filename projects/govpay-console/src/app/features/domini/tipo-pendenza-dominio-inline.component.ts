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
import { SnackbarService, InfoGridComponent, RequiredLabelDirective, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { DominiConsoleApi } from './domini.console-api';
import type { TipoPendenzaDominio, TipoPendenzaDominioCreate, TipoPendenzaDominioReplace, TipoPendenzaDominioSummary } from './dominio.model';

const CODIFICA_IUV_PATTERN = /^[0-9]{1,3}$/;

/**
 * Card view/edit inline di un tipo pendenza del dominio (o form di creazione se
 * `tipo` è null). Solo i campi core sono editabili; le sotto-strutture ricche
 * (portali, avvisature, visualizzazione, tracciato) sono preservate nel replace.
 */
@Component({
  selector: 'lnk-tipo-pendenza-dominio-inline',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, InfoGridComponent, InlineEditCardComponent, RequiredLabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './tipo-pendenza-dominio-inline.component.html',
})
export class TipoPendenzaDominioInlineComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DominiConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idDominio = input.required<string>();
  readonly tipo = input<TipoPendenzaDominioSummary | null>(null);
  /** Suggerimenti (codice tipo pendenza globale) per la creazione. */
  readonly tipiSuggestions = input<{ id: string; label?: string }[]>([]);

  readonly saved = output<void>();
  readonly cancelCreate = output<void>();

  private etag: string | null = null;
  private loaded = false;
  /** Dettaglio completo caricato: usato per vista, edit e per preservare i campi non modellati nel replace. */
  readonly detail = signal<TipoPendenzaDominio | null>(null);

  readonly isCreate = computed(() => this.tipo() === null);
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly statusTone = computed<'success' | 'muted'>(() => (this.tipo()?.abilitato ? 'success' : 'muted'));
  readonly statusLabel = computed(() => this.translate.instant(this.tipo()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly form = this.fb.nonNullable.group({
    idTipoPendenza: ['', [Validators.required, Validators.maxLength(35)]],
    codificaIUV: ['', [Validators.pattern(CODIFICA_IUV_PATTERN)]],
    pagaTerzi: [false],
    abilitato: [true],
  });

  readonly viewItems = computed<InfoGridItem[]>(() => {
    const t = this.tipo();
    if (!t) return [];
    const d = this.detail();
    const yesno = (v: boolean | undefined) => this.translate.instant(v ? 'Common.Yes' : 'Common.No');
    return [
      { labelKey: 'Domini.TipiPendenzaDominio.IdTipoPendenza', value: t.idTipoPendenza, mono: true },
      { labelKey: 'Domini.TipiPendenzaDominio.Descrizione', value: d?.tipoPendenza?.descrizione ?? t.descrizione, wide: true, hide: !(d?.tipoPendenza?.descrizione ?? t.descrizione) },
      { labelKey: 'Domini.TipiPendenzaDominio.CodificaIUV', value: d?.codificaIUV, mono: true, hide: !d?.codificaIUV },
      { labelKey: 'Domini.TipiPendenzaDominio.PagaTerzi', value: yesno(d?.pagaTerzi), hide: !d },
      { labelKey: 'Domini.TipiPendenzaDominio.Abilitato', value: yesno(t.abilitato) },
    ];
  });

  constructor() {
    effect(() => {
      const t = this.tipo();
      if (t) {
        this.form.controls.idTipoPendenza.disable();
        this.form.patchValue({ idTipoPendenza: t.idTipoPendenza, abilitato: t.abilitato ?? true }, { emitEvent: false });
      }
    });
    // Carica una volta il dettaglio completo: serve a vista, edit e preservazione nel replace.
    effect(() => {
      if (!this.isCreate() && !this.loaded) {
        this.loaded = true;
        this.fetchDetail();
      }
    });
  }

  private fetchDetail(): void {
    const t = this.tipo();
    if (!t) return;
    this.api
      .getTipoPendenzaWithETag(this.idDominio(), t.idTipoPendenza)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (!res?.body) return;
        this.etag = res.etag;
        this.detail.set(res.body);
        this.patchFormFromDetail(res.body);
      });
  }

  private patchFormFromDetail(b: TipoPendenzaDominio): void {
    this.form.patchValue(
      {
        codificaIUV: b.codificaIUV ?? '',
        pagaTerzi: b.pagaTerzi ?? false,
        abilitato: b.abilitato ?? true,
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

  /** Costruisce il replace preservando le sotto-strutture non modellate. */
  private replaceBody(): TipoPendenzaDominioReplace {
    const r = this.form.getRawValue();
    const preserved: Record<string, unknown> = {};
    const loaded = this.detail();
    if (loaded) {
      for (const [k, v] of Object.entries(loaded)) {
        if (k === 'idTipoPendenza' || k === 'tipoPendenza' || k === 'codificaIUV' || k === 'pagaTerzi' || k === 'abilitato') continue;
        preserved[k] = v;
      }
    }
    return {
      ...preserved,
      codificaIUV: r.codificaIUV.trim() || undefined,
      pagaTerzi: r.pagaTerzi,
      abilitato: r.abilitato,
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
      const r = this.form.getRawValue();
      const create: TipoPendenzaDominioCreate = {
        idTipoPendenza: r.idTipoPendenza,
        codificaIUV: r.codificaIUV.trim() || undefined,
        pagaTerzi: r.pagaTerzi,
        abilitato: r.abilitato,
      };
      this.api
        .createTipoPendenza(this.idDominio(), create)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Domini.TipiPendenzaDominio.Creato'));
          this.saved.emit();
        });
    } else {
      this.api
        .replaceTipoPendenza(this.idDominio(), this.tipo()!.idTipoPendenza, this.replaceBody(), this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.etag = res.etag;
          this.detail.set(res.body);
          this.snackbar.success(this.translate.instant('Domini.TipiPendenzaDominio.Aggiornato'));
          this.editing.set(false);
          this.saved.emit();
        });
    }
  }

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let key = 'Domini.TipiPendenzaDominio.SalvaErrore';
    if (!isEdit && err.status === 409) key = 'Domini.TipiPendenzaDominio.ConflittoId';
    else if (err.status === 422) key = 'Domini.TipiPendenzaDominio.Invalido';
    else if (isEdit && (err.status === 412 || err.status === 428)) key = 'Domini.Form.ConflittoConcorrenza';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
