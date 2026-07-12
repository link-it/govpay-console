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
import { FormActionBarComponent } from '@core/ui/form-action-bar/form-action-bar.component';
import { RefMultiselectComponent, type RefOption } from '@core/ui/ref-multiselect/ref-multiselect.component';
import { TipiPendenzaConsoleApi } from '@feature/tipi-pendenza';
import { RuoliConsoleApi } from '@feature/ruoli';
import { ApplicazioniConsoleApi } from './applicazioni.console-api';
import type { ApplicazioneCreate, ApplicazioneReplace, CodificaAvvisi } from './applicazione.model';

/** Pattern idA2A (`^[a-zA-Z0-9\-_]{1,35}$`). */
const ID_PATTERN = /^[a-zA-Z0-9\-_]{1,35}$/;
/** Codifica IUV: 1-3 cifre. */
const IUV_PATTERN = /^[0-9]{1,3}$/;

@Component({
  selector: 'lnk-applicazione-form',
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
    RefMultiselectComponent,
    FormActionBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applicazione-form.component.html',
})
export class ApplicazioneFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApplicazioniConsoleApi);
  private readonly tipiApi = inject(TipiPendenzaConsoleApi);
  private readonly ruoliApi = inject(RuoliConsoleApi);
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

  readonly domini = signal<string[]>([]);
  readonly tipiPendenza = signal<string[]>([]);
  readonly ruoli = signal<string[]>([]);
  readonly aclValue = signal<Acl[]>([]);

  readonly tipiSuggestions = signal<RefOption[]>([]);
  readonly ruoliSuggestions = signal<RefOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    idA2A: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    principal: ['', [Validators.required, Validators.maxLength(4000)]],
    abilitato: [true],
    codificaIuv: ['', [Validators.pattern(IUV_PATTERN)]],
    regExpIuv: [''],
    generazioneIuvInterna: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idA2A');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.Applicazioni', url: '/applicazioni' },
      { label: id ?? this.translate.instant('Applicazioni.Form.Nuova') },
    ]);

    this.loadSuggestions();

    if (id) {
      this.form.controls.idA2A.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/applicazioni']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          const a = res.body;
          this.form.patchValue({
            idA2A: a.idA2A,
            principal: a.principal,
            abilitato: a.abilitato,
            codificaIuv: a.codificaAvvisi?.codificaIuv ?? '',
            regExpIuv: a.codificaAvvisi?.regExpIuv ?? '',
            generazioneIuvInterna: a.codificaAvvisi?.generazioneIuvInterna ?? false,
          });
          this.domini.set((a.domini ?? []).map((d) => d.idDominio));
          this.tipiPendenza.set((a.tipiPendenza ?? []).map((t) => t.idTipoPendenza));
          this.ruoli.set((a.ruoli ?? []).map((r) => r.id));
          this.aclValue.set((a.acl ?? []).map((x) => ({ servizio: x.servizio, autorizzazioni: [...x.autorizzazioni] })));
        });
    }
  }

  private loadSuggestions(): void {
    this.tipiApi
      .list({ limit: 200 })
      .pipe(catchError(() => of({ results: [] })))
      .subscribe((s) => this.tipiSuggestions.set((s.results ?? []).map((t) => ({ id: t.idTipoPendenza, label: t.descrizione }))));
    this.ruoliApi
      .list({ limit: 200 })
      .pipe(catchError(() => of({ results: [] })))
      .subscribe((s) => this.ruoliSuggestions.set((s.results ?? []).map((r) => ({ id: r.idRuolo }))));
  }

  private buildCodificaAvvisi(): CodificaAvvisi | undefined {
    const r = this.form.getRawValue();
    if (!r.codificaIuv && !r.regExpIuv && !r.generazioneIuvInterna) return undefined;
    return {
      codificaIuv: r.codificaIuv || undefined,
      regExpIuv: r.regExpIuv || undefined,
      generazioneIuvInterna: r.generazioneIuvInterna,
    };
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const assoc = {
      codificaAvvisi: this.buildCodificaAvvisi(),
      domini: this.domini().map((idDominio) => ({ idDominio })),
      tipiPendenza: this.tipiPendenza().map((idTipoPendenza) => ({ idTipoPendenza })),
      ruoli: this.ruoli().map((id) => ({ id })),
      acl: this.aclValue(),
    };

    if (this.editId) {
      const body: ApplicazioneReplace = { principal: raw.principal, abilitato: raw.abilitato, ...assoc };
      this.api
        .replace(this.editId, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Applicazioni.Form.Aggiornata'));
          this.router.navigate(['/applicazioni', this.editId]);
        });
    } else {
      const body: ApplicazioneCreate = { idA2A: raw.idA2A, principal: raw.principal, abilitato: raw.abilitato, ...assoc };
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('Applicazioni.Form.Salvata'));
          this.router.navigate(['/applicazioni', body.idA2A]);
        });
    }
  }

  readonly backLink = computed(() => (this.editId$() ? ['/applicazioni', this.editId$()!] : ['/applicazioni']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'Applicazioni.Form.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'Applicazioni.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'Applicazioni.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
