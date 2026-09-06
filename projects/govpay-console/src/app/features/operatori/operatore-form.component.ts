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
import { FormActionBarComponent, SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  LoadingComponent,
  PageHeaderComponent,
  ListStickyToolbarDirective,
  RequiredLabelDirective,
} from '@linkit/shared-ui';
import { problemDetail, type Acl } from '@core/models';
import { AclEditorComponent } from '@core/ui/acl-editor/acl-editor.component';
import { RefMultiselectComponent, type RefOption } from '@core/ui/ref-multiselect/ref-multiselect.component';
import { TipiPendenzaConsoleApi } from '@feature/tipi-pendenza';
import { RuoliConsoleApi } from '@feature/ruoli';
import { OperatoriConsoleApi } from './operatori.console-api';
import type { OperatoreCreate, OperatoreReplace } from './operatore.model';

@Component({
  selector: 'lnk-operatore-form',
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
  templateUrl: './operatore-form.component.html',
})
export class OperatoreFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OperatoriConsoleApi);
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

  /** Associazioni gestite fuori dal reactive form. */
  readonly domini = signal<string[]>([]);
  readonly tipiPendenza = signal<string[]>([]);
  readonly ruoli = signal<string[]>([]);
  readonly aclValue = signal<Acl[]>([]);

  /** Suggerimenti per i multi-select (caricati dai rispettivi API). */
  readonly tipiSuggestions = signal<RefOption[]>([]);
  readonly ruoliSuggestions = signal<RefOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    principal: ['', [Validators.required, Validators.maxLength(4000)]],
    nome: ['', [Validators.required, Validators.maxLength(35)]],
    abilitato: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('principal');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.Operatori', url: '/operatori' },
      { label: id ?? this.translate.instant('Operatori.Form.Nuovo') },
    ]);

    this.loadSuggestions();

    if (id) {
      this.form.controls.principal.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/operatori']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          const o = res.body;
          this.form.patchValue({ principal: o.principal, nome: o.nome, abilitato: o.abilitato });
          this.domini.set((o.domini ?? []).map((d) => d.idDominio));
          this.tipiPendenza.set((o.tipiPendenza ?? []).map((t) => t.idTipoPendenza));
          this.ruoli.set((o.ruoli ?? []).map((r) => r.id));
          this.aclValue.set((o.acl ?? []).map((a) => ({ servizio: a.servizio, autorizzazioni: [...a.autorizzazioni] })));
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

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const assoc = {
      domini: this.domini().map((idDominio) => ({ idDominio })),
      tipiPendenza: this.tipiPendenza().map((idTipoPendenza) => ({ idTipoPendenza })),
      ruoli: this.ruoli().map((id) => ({ id })),
      acl: this.aclValue(),
    };

    if (this.editId) {
      const body: OperatoreReplace = { nome: raw.nome, abilitato: raw.abilitato, ...assoc };
      this.api
        .replace(this.editId, body, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Operatori.Form.Aggiornato'));
          this.router.navigate(['/operatori', this.editId]);
        });
    } else {
      const body: OperatoreCreate = { principal: raw.principal, nome: raw.nome, abilitato: raw.abilitato, ...assoc };
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('Operatori.Form.Salvato'));
          this.router.navigate(['/operatori', body.principal]);
        });
    }
  }

  readonly backLink = computed(() => (this.editId$() ? ['/operatori', this.editId$()!] : ['/operatori']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'Operatori.Form.ConflittoId';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'Operatori.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'Operatori.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
