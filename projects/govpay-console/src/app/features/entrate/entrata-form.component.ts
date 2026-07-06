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
import { EntrateConsoleApi } from './entrate.console-api';
import { TIPI_CONTABILITA, type EntrataCreate, type EntrataReplace, type TipoContabilita } from './entrata.model';

/** Pattern id entrata (max 255, allineato allo schema). */
const ID_PATTERN = /^.{1,255}$/;

@Component({
  selector: 'lnk-entrata-form',
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
  templateUrl: './entrata-form.component.html',
})
export class EntrataFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EntrateConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private editId: string | null = null;
  private etag: string | null = null;

  readonly editId$ = signal<string | null>(null);
  readonly isEdit = computed(() => this.editId$() !== null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly tipiContabilita = TIPI_CONTABILITA;

  readonly form = this.fb.nonNullable.group({
    idEntrata: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    descrizione: ['', [Validators.required, Validators.maxLength(255)]],
    tipoContabilita: ['CAPITOLO' as TipoContabilita, [Validators.required]],
    codiceContabilita: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idEntrata');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.Entrate', url: '/entrate' },
      { label: id ?? this.translate.instant('Entrate.Form.Nuova') },
    ]);

    if (id) {
      this.form.controls.idEntrata.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/entrate']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          this.form.patchValue({
            idEntrata: res.body.idEntrata,
            descrizione: res.body.descrizione,
            tipoContabilita: res.body.tipoContabilita,
            codiceContabilita: res.body.codiceContabilita,
          });
        });
    }
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.editId) {
      const body: EntrataReplace = {
        descrizione: raw.descrizione,
        tipoContabilita: raw.tipoContabilita,
        codiceContabilita: raw.codiceContabilita,
      };
      this.api
        .replace(this.editId, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Entrate.Form.Aggiornata'));
          this.router.navigate(['/entrate', this.editId]);
        });
    } else {
      const body: EntrataCreate = {
        idEntrata: raw.idEntrata,
        descrizione: raw.descrizione,
        tipoContabilita: raw.tipoContabilita,
        codiceContabilita: raw.codiceContabilita,
      };
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('Entrate.Form.Salvata'));
          this.router.navigate(['/entrate', body.idEntrata]);
        });
    }
  }

  readonly backLink = computed(() => (this.editId$() ? ['/entrate', this.editId$()!] : ['/entrate']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'Entrate.Form.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'Entrate.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'Entrate.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
