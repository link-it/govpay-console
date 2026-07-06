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
import { problemDetail, type Acl } from '@core/models';
import { AclEditorComponent } from '@core/ui/acl-editor/acl-editor.component';
import { RuoliConsoleApi } from './ruoli.console-api';
import type { RuoloCreate, RuoloReplace } from './ruolo.model';

/** Pattern id ruolo (max 255). */
const ID_PATTERN = /^.{1,255}$/;

@Component({
  selector: 'lnk-ruolo-form',
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
    AclEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruolo-form.component.html',
})
export class RuoloFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RuoliConsoleApi);
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

  /** ACL gestite fuori dal reactive form (editor custom). */
  readonly aclValue = signal<Acl[]>([]);

  readonly form = this.fb.nonNullable.group({
    idRuolo: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
  });

  /** Submit abilitato solo con id valido e almeno una ACL. */
  readonly canSave = computed(() => this.aclValue().length > 0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idRuolo');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.Ruoli', url: '/ruoli' },
      { label: id ?? this.translate.instant('Ruoli.Form.Nuovo') },
    ]);

    if (id) {
      this.form.controls.idRuolo.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/ruoli']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          this.form.patchValue({ idRuolo: res.body.idRuolo });
          // `ruolo` (origine) è readOnly: teniamo solo servizio+autorizzazioni.
          this.aclValue.set((res.body.acl ?? []).map((a) => ({ servizio: a.servizio, autorizzazioni: [...a.autorizzazioni] })));
        });
    }
  }

  save(): void {
    if (this.form.invalid || !this.canSave() || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.editId) {
      const body: RuoloReplace = { acl: this.aclValue() };
      this.api
        .replace(this.editId, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Ruoli.Form.Aggiornato'));
          this.router.navigate(['/ruoli', this.editId]);
        });
    } else {
      const body: RuoloCreate = { idRuolo: raw.idRuolo, acl: this.aclValue() };
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('Ruoli.Form.Salvato'));
          this.router.navigate(['/ruoli', body.idRuolo]);
        });
    }
  }

  readonly backLink = computed(() => (this.editId$() ? ['/ruoli', this.editId$()!] : ['/ruoli']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'Ruoli.Form.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'Ruoli.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'Ruoli.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
