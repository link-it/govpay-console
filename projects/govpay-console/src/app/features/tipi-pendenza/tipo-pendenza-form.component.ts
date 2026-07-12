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
import { SnackbarService, SystemFacade, TabsComponent, type TabDef } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  LoadingComponent,
  PageHeaderComponent,
  ListStickyToolbarDirective,
  RequiredLabelDirective,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { JsonFieldComponent } from '@core/ui/json-field/json-field.component';
import { ApplicazioniConsoleApi } from '@feature/applicazioni/applicazioni.console-api';
import { TipiPendenzaConsoleApi } from './tipi-pendenza.console-api';
import type {
  TipoPendenza,
  TipoPendenzaCreate,
  TipoPendenzaPortale,
  TipoPendenzaReplace,
} from './tipo-pendenza.model';

/** Pattern id tipo pendenza (max 35). */
const ID_PATTERN = /^.{1,35}$/;
/** Codifica IUV: 1-3 cifre. */
const IUV_PATTERN = /^[0-9]{1,3}$/;

/** Opzioni `form.tipo` (generatore layout). */
const FORM_TIPO_OPTIONS = ['angular2-json-schema-form', 'surveyjs'];

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
    TabsComponent,
    JsonFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipo-pendenza-form.component.html',
})
export class TipoPendenzaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TipiPendenzaConsoleApi);
  private readonly applicazioniApi = inject(ApplicazioniConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private editId: string | null = null;
  private etag: string | null = null;
  /** Tipo pendenza caricato: preserva chiavi config non modellate nel replace. */
  private loaded: TipoPendenza | null = null;

  readonly editId$ = signal<string | null>(null);
  readonly isEdit = computed(() => this.editId$() !== null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly formTipoOptions = FORM_TIPO_OPTIONS;
  /** Opzioni per il select `inoltro` (idA2A delle applicazioni). */
  readonly applicazioni = signal<string[]>([]);

  readonly activeTab = signal<'dati' | 'backoffice' | 'pagamento'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati', labelKey: 'TipiPendenza.Form.TabDati' },
    { id: 'backoffice', labelKey: 'TipiPendenza.Form.TabPortaleBackoffice' },
    { id: 'pagamento', labelKey: 'TipiPendenza.Form.TabPortalePagamento' },
  ]);

  readonly form = this.fb.group({
    idTipoPendenza: this.fb.control('', [Validators.required, Validators.pattern(ID_PATTERN)]),
    descrizione: this.fb.control('', [Validators.required, Validators.maxLength(255)]),
    codificaIUV: this.fb.control('', [Validators.pattern(IUV_PATTERN)]),
    pagaTerzi: this.fb.control(false),
    abilitato: this.fb.control(true),
    portaleBackoffice: this.buildPortaleGroup(false),
    portalePagamento: this.buildPortaleGroup(true),
  });

  /** Sottogruppo di un portale (backoffice/pagamento). `impaginazione` solo pagamento. */
  private buildPortaleGroup(withImpaginazione: boolean) {
    return this.fb.group({
      abilitato: this.fb.control(false),
      formTipo: this.fb.control(''),
      formDefinizione: this.fb.control<unknown>(null),
      ...(withImpaginazione ? { formImpaginazione: this.fb.control<unknown>(null) } : {}),
      validazione: this.fb.control<unknown>(null),
      trasformazioneTipo: this.fb.control(''),
      trasformazioneDefinizione: this.fb.control<unknown>(null),
      inoltro: this.fb.control(''),
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idTipoPendenza');
    this.editId = id;
    this.editId$.set(id);
    this.system.setBreadcrumbs([
      { label: 'Nav.TipiPendenza', url: '/tipi-pendenza' },
      { label: id ?? this.translate.instant('TipiPendenza.Form.Nuovo') },
    ]);

    this.loadApplicazioni();

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
          this.patchFrom(res.body);
        });
    }
  }

  private loadApplicazioni(): void {
    this.applicazioniApi
      .list({ limit: 200 })
      .pipe(catchError(() => of({ results: [] })))
      .subscribe((slice) => this.applicazioni.set((slice.results ?? []).map((a) => a.idA2A)));
  }

  private patchFrom(t: TipoPendenza): void {
    this.form.patchValue({
      idTipoPendenza: t.idTipoPendenza,
      descrizione: t.descrizione,
      codificaIUV: t.codificaIUV ?? '',
      pagaTerzi: t.pagaTerzi ?? false,
      abilitato: t.abilitato ?? true,
    });
    this.patchPortale(this.form.controls.portaleBackoffice, t.portaleBackoffice);
    this.patchPortale(this.form.controls.portalePagamento, t.portalePagamento);
  }

  private patchPortale(group: ReturnType<TipoPendenzaFormComponent['buildPortaleGroup']>, p?: TipoPendenzaPortale): void {
    if (!p) return;
    group.patchValue({
      abilitato: p.abilitato ?? false,
      formTipo: p.form?.tipo ?? '',
      formDefinizione: p.form?.definizione ?? null,
      validazione: p.validazione ?? null,
      trasformazioneTipo: p.trasformazione?.tipo ?? '',
      trasformazioneDefinizione: p.trasformazione?.definizione ?? null,
      inoltro: p.inoltro ?? '',
    });
    const imp = group.get('formImpaginazione');
    if (imp) imp.setValue(p.form?.impaginazione ?? null);
  }

  /** Ricostruisce il blocco portale preservando eventuali chiavi non modellate. */
  private buildPortale(raw: Record<string, unknown>, loaded: TipoPendenzaPortale | undefined): TipoPendenzaPortale {
    const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    const form = {
      ...(loaded?.form ?? {}),
      tipo: s(raw['formTipo']),
      definizione: raw['formDefinizione'] ?? undefined,
      ...(('formImpaginazione' in raw) ? { impaginazione: raw['formImpaginazione'] ?? undefined } : {}),
    };
    const trasformazione = {
      ...(loaded?.trasformazione ?? {}),
      tipo: s(raw['trasformazioneTipo']),
      definizione: raw['trasformazioneDefinizione'] ?? undefined,
    };
    const isEmpty = (o: Record<string, unknown>) => Object.values(o).every((v) => v == null);
    return {
      ...(loaded ?? {}),
      abilitato: !!raw['abilitato'],
      form: isEmpty(form) ? undefined : form,
      validazione: raw['validazione'] ?? undefined,
      trasformazione: isEmpty(trasformazione) ? undefined : trasformazione,
      inoltro: s(raw['inoltro']),
    };
  }

  /** Sotto-oggetti config non ancora editati (avvisatura/tracciato/visualizzazione), preservati. */
  private preservedConfig(): Partial<TipoPendenzaReplace> {
    const l = this.loaded;
    if (!l) return {};
    return {
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
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const portaleBackoffice = this.buildPortale(raw['portaleBackoffice'] as Record<string, unknown>, this.loaded?.portaleBackoffice);
    const portalePagamento = this.buildPortale(raw['portalePagamento'] as Record<string, unknown>, this.loaded?.portalePagamento);

    if (this.editId) {
      const body: TipoPendenzaReplace = {
        ...this.preservedConfig(),
        descrizione: raw['descrizione'] as string,
        codificaIUV: (raw['codificaIUV'] as string) || undefined,
        pagaTerzi: raw['pagaTerzi'] as boolean,
        abilitato: raw['abilitato'] as boolean,
        portaleBackoffice,
        portalePagamento,
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
        idTipoPendenza: raw['idTipoPendenza'] as string,
        descrizione: raw['descrizione'] as string,
        codificaIUV: (raw['codificaIUV'] as string) || undefined,
        pagaTerzi: raw['pagaTerzi'] as boolean,
        abilitato: raw['abilitato'] as boolean,
        portaleBackoffice,
        portalePagamento,
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
    else if (err.status === 422) msgKey = 'TipiPendenza.Form.Invalido';
    const fallback = this.translate.instant(msgKey ?? 'TipiPendenza.Form.SalvaErrore');
    this.snackbar.error(problemDetail(err, fallback));
    return of(null);
  }
}
