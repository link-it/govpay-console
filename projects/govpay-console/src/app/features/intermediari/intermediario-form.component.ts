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
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
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
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { FormActionBarComponent } from '@core/ui/form-action-bar/form-action-bar.component';
import { RequiredLabelDirective } from '@linkit/shared-ui';
import { IntermediariConsoleApi } from './intermediari.console-api';
import type { IntermediarioCreate, IntermediarioReplace } from './intermediario.model';

/** Pattern id intermediario (schema OpenAPI: `^[a-zA-Z0-9\-_]{1,35}$`). */
const ID_PATTERN = /^[a-zA-Z0-9\-_]{1,35}$/;

@Component({
  selector: 'lnk-intermediario-form',
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
    FormActionBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intermediario-form.component.html',
})
export class IntermediarioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(IntermediariConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  /** Id da path in modifica; `null` in creazione. */
  private editId: string | null = null;
  /** ETag catturato in modifica per l'`If-Match` del PUT. */
  private etag: string | null = null;

  /** Signal dell'id in modifica (per il template). */
  readonly editId$ = signal<string | null>(null);
  readonly isEdit = computed(() => this.editId$() !== null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    idIntermediario: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    denominazione: ['', [Validators.required, Validators.maxLength(255)]],
    principalPagoPa: ['', [Validators.required, Validators.maxLength(4000)]],
    abilitato: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idIntermediario');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.Intermediari', url: '/intermediari' },
      { label: id ?? this.translate.instant('Intermediari.Form.Nuovo') },
    ]);

    if (id) {
      // Modifica: id non modificabile, precompila e cattura l'ETag.
      this.form.controls.idIntermediario.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/intermediari']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          this.form.patchValue({
            idIntermediario: res.body.idIntermediario,
            denominazione: res.body.denominazione,
            principalPagoPa: res.body.principalPagoPa,
            abilitato: res.body.abilitato,
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
      const body: IntermediarioReplace = {
        denominazione: raw.denominazione,
        principalPagoPa: raw.principalPagoPa,
        abilitato: raw.abilitato,
      };
      this.api
        .replace(this.editId, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Intermediari.Form.Aggiornato'));
          this.router.navigate(['/intermediari', this.editId]);
        });
    } else {
      const body: IntermediarioCreate = {
        idIntermediario: raw.idIntermediario,
        denominazione: raw.denominazione,
        principalPagoPa: raw.principalPagoPa,
        abilitato: raw.abilitato,
      };
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('Intermediari.Form.Salvato'));
          this.router.navigate(['/intermediari', body.idIntermediario]);
        });
    }
  }

  /** Rotta di ritorno: dettaglio in modifica, lista in creazione. */
  readonly backLink = computed(() => (this.editId$() ? ['/intermediari', this.editId$()!] : ['/intermediari']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'Intermediari.Form.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'Intermediari.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'Intermediari.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
