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
import { problemDetail } from '@core/models';
import { EnteCreditoreLookupComponent, type EnteCreditore } from '@feature/pagopa';
import { DominiConsoleApi } from './domini.console-api';
import type { DominioCreate, DominioReplace } from './dominio.model';

/** Pattern idDominio (`^[0-9]{11}$`). */
const ID_PATTERN = /^[0-9]{11}$/;

@Component({
  selector: 'lnk-dominio-form',
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
    EnteCreditoreLookupComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dominio-form.component.html',
})
export class DominioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DominiConsoleApi);
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

  readonly form = this.fb.nonNullable.group({
    idDominio: ['', [Validators.required, Validators.pattern(ID_PATTERN)]],
    ragioneSociale: ['', [Validators.required, Validators.maxLength(70)]],
    abilitato: [true],
    intermediato: [true],
    scaricaFr: [false],
    gln: [''],
    idStazione: [''],
    cbill: [''],
    iuvPrefix: [''],
    auxDigit: [null as number | null],
    segregationCode: [null as number | null],
    tassonomiaPagoPA: [''],
    autStampaPosteItaliane: [''],
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idDominio');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.Domini', url: '/domini' },
      { label: id ?? this.translate.instant('Domini.Form.Nuovo') },
    ]);

    if (id) {
      this.form.controls.idDominio.disable();
      this.loading.set(true);
      this.api
        .getWithETag(id)
        .pipe(
          catchError((err) => {
            this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
            this.router.navigate(['/domini']);
            return of(null);
          })
        )
        .subscribe((res) => {
          this.loading.set(false);
          if (!res?.body) return;
          this.etag = res.etag;
          const d = res.body;
          this.form.patchValue({
            idDominio: d.idDominio,
            ragioneSociale: d.ragioneSociale,
            abilitato: d.abilitato ?? true,
            intermediato: d.intermediato ?? true,
            scaricaFr: d.scaricaFr ?? false,
            gln: d.gln ?? '',
            idStazione: d.idStazione ?? '',
            cbill: d.cbill ?? '',
            iuvPrefix: d.iuvPrefix ?? '',
            auxDigit: d.auxDigit ?? null,
            segregationCode: d.segregationCode ?? null,
            tassonomiaPagoPA: d.tassonomiaPagoPA ?? '',
            autStampaPosteItaliane: d.autStampaPosteItaliane ?? '',
            indirizzo: d.indirizzo ?? '',
            civico: d.civico ?? '',
            cap: d.cap ?? '',
            localita: d.localita ?? '',
            provincia: d.provincia ?? '',
            nazione: d.nazione ?? '',
            email: d.email ?? '',
            pec: d.pec ?? '',
            tel: d.tel ?? '',
            web: d.web ?? '',
            area: d.area ?? '',
          });
        });
    }
  }

  /**
   * Precompila il form dall'anagrafica pagoPA selezionata nel lookup (solo in
   * creazione). `auxDigit`/`segregationCode` arrivano come stringa da pagoPA →
   * convertiti a numero per il form.
   */
  onEnteCreditoreSelected(ente: EnteCreditore): void {
    const toNum = (v?: string): number | null => {
      if (v == null || v.trim() === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    this.form.patchValue({
      idDominio: ente.taxCode,
      ragioneSociale: ente.companyName,
      idStazione: ente.stationId ?? '',
      cbill: ente.cbill ?? '',
      auxDigit: toNum(ente.auxDigit),
      segregationCode: toNum(ente.segregationCode),
    });
    this.snackbar.success(this.translate.instant('PagoPA.EnteCreditore.Precompilato'));
  }

  /** Compone il body (Create/Replace condividono i campi tranne idDominio). */
  private buildBody(): DominioCreate {
    const r = this.form.getRawValue();
    const s = (v: string): string | undefined => v.trim() || undefined;
    return {
      idDominio: r.idDominio,
      ragioneSociale: r.ragioneSociale,
      abilitato: r.abilitato,
      scaricaFr: r.scaricaFr,
      intermediato: r.intermediato,
      gln: s(r.gln),
      idStazione: s(r.idStazione),
      cbill: s(r.cbill),
      iuvPrefix: s(r.iuvPrefix),
      auxDigit: r.auxDigit ?? undefined,
      segregationCode: r.segregationCode ?? undefined,
      tassonomiaPagoPA: s(r.tassonomiaPagoPA),
      autStampaPosteItaliane: s(r.autStampaPosteItaliane),
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
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const body = this.buildBody();

    if (this.editId) {
      const { idDominio: _omit, ...replace } = body;
      void _omit;
      this.api
        .replace(this.editId, replace as DominioReplace, this.etag)
        .pipe(catchError((err) => this.onError(err, true)))
        .subscribe((res) => {
          this.saving.set(false);
          if (!res) return;
          this.snackbar.success(this.translate.instant('Domini.Form.Aggiornato'));
          this.router.navigate(['/domini', this.editId]);
        });
    } else {
      this.api
        .create(body)
        .pipe(catchError((err) => this.onError(err, false)))
        .subscribe((created) => {
          this.saving.set(false);
          if (!created) return;
          this.snackbar.success(this.translate.instant('Domini.Form.Salvato'));
          this.router.navigate(['/domini', body.idDominio]);
        });
    }
  }

  readonly backLink = computed(() => (this.editId$() ? ['/domini', this.editId$()!] : ['/domini']));

  private onError(err: HttpErrorResponse, isEdit: boolean) {
    this.saving.set(false);
    let msgKey: string | null = null;
    if (!isEdit && err.status === 409) msgKey = 'Domini.Form.ConflittoId';
    else if (err.status === 422) msgKey = 'Domini.Form.Invalido';
    else if (isEdit && (err.status === 412 || err.status === 428)) msgKey = 'Domini.Form.ConflittoConcorrenza';
    const fallback = this.translate.instant(msgKey ?? 'Domini.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
