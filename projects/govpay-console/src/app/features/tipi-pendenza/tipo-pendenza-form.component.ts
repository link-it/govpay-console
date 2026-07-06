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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  LoadingComponent,
  PageHeaderComponent,
  ListStickyToolbarDirective,
  RequiredLabelDirective,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { TipiPendenzaConsoleApi } from './tipi-pendenza.console-api';
import type { TipoPendenza, TipoPendenzaCreate, TipoPendenzaReplace } from './tipo-pendenza.model';

/** Pattern id tipo pendenza (max 35). */
const ID_PATTERN = /^.{1,35}$/;
/** Codifica IUV: 1-3 cifre. */
const IUV_PATTERN = /^[0-9]{1,3}$/;

@Component({
  selector: 'lnk-tipo-pendenza-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
    RequiredLabelDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipo-pendenza-form.component.html',
})
export class TipoPendenzaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TipiPendenzaConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private editId: string | null = null;
  private etag: string | null = null;
  /** Tipo pendenza caricato: serve a preservare i sotto-oggetti config nel replace. */
  private loaded: TipoPendenza | null = null;

  readonly editId$ = signal<string | null>(null);
  readonly isEdit = computed(() => this.editId$() !== null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    idTipoPendenza: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    descrizione: ['', [Validators.required, Validators.maxLength(255)]],
    codificaIUV: ['', [Validators.pattern(IUV_PATTERN)]],
    pagaTerzi: [false],
    abilitato: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idTipoPendenza');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.TipiPendenza', url: '/tipi-pendenza' },
      { label: id ?? this.translate.instant('TipiPendenza.Form.Nuovo') },
    ]);

    if (id) {
      this.form.controls.idTipoPendenza.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/tipi-pendenza']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          this.loaded = res.body;
          this.form.patchValue({
            idTipoPendenza: res.body.idTipoPendenza,
            descrizione: res.body.descrizione,
            codificaIUV: res.body.codificaIUV ?? '',
            pagaTerzi: res.body.pagaTerzi ?? false,
            abilitato: res.body.abilitato ?? true,
          });
        });
    }
  }

  /** Sotto-oggetti config preservati dal record caricato (non editati qui). */
  private preservedConfig(): Partial<TipoPendenzaReplace> {
    const l = this.loaded;
    if (!l) return {};
    return {
      portaleBackoffice: l.portaleBackoffice,
      portalePagamento: l.portalePagamento,
      avvisaturaMail: l.avvisaturaMail,
      avvisaturaAppIO: l.avvisaturaAppIO,
      visualizzazione: l.visualizzazione,
      tracciatoCsv: l.tracciatoCsv,
    };
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.editId) {
      const body: TipoPendenzaReplace = {
        ...this.preservedConfig(),
        descrizione: raw.descrizione,
        codificaIUV: raw.codificaIUV || undefined,
        pagaTerzi: raw.pagaTerzi,
        abilitato: raw.abilitato,
      };
      this.api
        .replace(this.editId, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('TipiPendenza.Form.Aggiornato'));
          this.router.navigate(['/tipi-pendenza', this.editId]);
        });
    } else {
      const body: TipoPendenzaCreate = {
        idTipoPendenza: raw.idTipoPendenza,
        descrizione: raw.descrizione,
        codificaIUV: raw.codificaIUV || undefined,
        pagaTerzi: raw.pagaTerzi,
        abilitato: raw.abilitato,
      };
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('TipiPendenza.Form.Salvato'));
          this.router.navigate(['/tipi-pendenza', body.idTipoPendenza]);
        });
    }
  }

  readonly backLink = computed(() => (this.editId$() ? ['/tipi-pendenza', this.editId$()!] : ['/tipi-pendenza']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'TipiPendenza.Form.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'TipiPendenza.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'TipiPendenza.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
