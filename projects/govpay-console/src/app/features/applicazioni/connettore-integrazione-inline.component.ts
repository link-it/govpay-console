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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, InfoGridComponent, LoadingComponent, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail, type ConnettoreCredenziali } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { SelectComponent } from '@core/ui/select/select.component';
import { ApplicazioniConsoleApi } from './applicazioni.console-api';
import type { ConnettoreIntegrazioneApplicazione, TipoAutIntegrazione, VersioneIntegrazione } from './applicazione.model';

const TIPI_AUTH: TipoAutIntegrazione[] = ['NONE', 'BASIC', 'SSL'];
const VERSIONI: VersioneIntegrazione[] = ['REST_V1', 'REST_V2'];

/**
 * Card **view/edit inline** del connettore di integrazione dell'applicazione.
 * Carica da sé il connettore (+ETag), mostra la sintesi in lettura e in edit il
 * form config (campi condizionali per `tipoAutenticazione`) + credenziali
 * write-only. Salva via `replaceConnettoreIntegrazione` + `putCredenziali`.
 */
@Component({
  selector: 'lnk-connettore-integrazione-inline',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, InfoGridComponent, LoadingComponent, InlineEditCardComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './connettore-integrazione-inline.component.html',
})
export class ConnettoreIntegrazioneInlineComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApplicazioniConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idA2A = input.required<string>();

  private etag: string | null = null;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly connettore = signal<ConnettoreIntegrazioneApplicazione | null>(null);

  readonly tipiAuth = TIPI_AUTH;
  readonly versioni = VERSIONI;

  readonly form = this.fb.nonNullable.group({
    abilitato: [false],
    url: [''],
    versione: ['REST_V1' as VersioneIntegrazione],
    tipoAutenticazione: ['NONE' as TipoAutIntegrazione],
    username: [''],
    sslTipo: ['CLIENT'],
    ksLocation: [''],
    ksType: [''],
    tsLocation: [''],
    tsType: [''],
    sslType: [''],
    connectTimeoutMs: [null as number | null],
    readTimeoutMs: [null as number | null],
    credenziali: this.fb.nonNullable.group({
      password: [''],
      ksPassword: [''],
      tsPassword: [''],
      ksPKeyPasswd: [''],
    }),
  });

  readonly authType = toSignal(this.form.controls.tipoAutenticazione.valueChanges, {
    initialValue: 'NONE' as TipoAutIntegrazione,
  });

  readonly statusTone = computed<'success' | 'muted'>(() => (this.connettore()?.abilitato ? 'success' : 'muted'));
  readonly statusLabel = computed(() =>
    this.connettore()
      ? this.translate.instant(this.connettore()!.abilitato ? 'Common.Yes' : 'Common.No')
      : this.translate.instant('Applicazioni.Connettore.NonConfigurato')
  );

  readonly viewItems = computed<InfoGridItem[]>(() => {
    const c = this.connettore();
    if (!c) return [{ labelKey: 'Applicazioni.Connettore.Stato', value: this.translate.instant('Applicazioni.Connettore.NonConfigurato') }];
    return [
      { labelKey: 'Applicazioni.Connettore.Stato', value: this.translate.instant(c.abilitato ? 'Common.Yes' : 'Common.No') },
      { labelKey: 'Applicazioni.Connettore.Url', value: c.url, mono: true, wide: true, hide: !c.url },
      { labelKey: 'Applicazioni.Connettore.Versione', value: c.versione, hide: !c.versione },
      { labelKey: 'Applicazioni.Connettore.TipoAuth', value: c.tipoAutenticazione, hide: !c.tipoAutenticazione },
    ];
  });

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.api
      .getConnettoreIntegrazioneWithETag(this.idA2A())
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.apply(res.body);
      });
  }

  private apply(c: ConnettoreIntegrazioneApplicazione): void {
    this.connettore.set(c);
    this.form.patchValue({
      abilitato: c.abilitato,
      url: c.url ?? '',
      versione: c.versione ?? 'REST_V1',
      tipoAutenticazione: c.tipoAutenticazione ?? 'NONE',
      username: c.username ?? '',
      sslTipo: c.sslTipo ?? 'CLIENT',
      ksLocation: c.ksLocation ?? '',
      ksType: c.ksType ?? '',
      tsLocation: c.tsLocation ?? '',
      tsType: c.tsType ?? '',
      sslType: c.sslType ?? '',
      connectTimeoutMs: c.connectTimeoutMs ?? null,
      readTimeoutMs: c.readTimeoutMs ?? null,
    });
    this.form.controls.credenziali.reset();
  }

  onCancel(): void {
    const c = this.connettore();
    if (c) this.apply(c);
  }

  private buildConnettore(): ConnettoreIntegrazioneApplicazione {
    const r = this.form.getRawValue();
    return {
      abilitato: r.abilitato,
      url: r.url || undefined,
      versione: r.versione,
      tipoAutenticazione: r.tipoAutenticazione,
      username: r.username || undefined,
      sslTipo: r.tipoAutenticazione === 'SSL' ? (r.sslTipo as 'CLIENT' | 'SERVER') : undefined,
      ksLocation: r.ksLocation || undefined,
      ksType: r.ksType || undefined,
      tsLocation: r.tsLocation || undefined,
      tsType: r.tsType || undefined,
      sslType: r.sslType || undefined,
      connectTimeoutMs: r.connectTimeoutMs ?? undefined,
      readTimeoutMs: r.readTimeoutMs ?? undefined,
    };
  }

  private buildCredenziali(): ConnettoreCredenziali {
    const c = this.form.controls.credenziali.getRawValue();
    const out: ConnettoreCredenziali = {};
    if (c.password) out.password = c.password;
    if (c.ksPassword) out.ksPassword = c.ksPassword;
    if (c.tsPassword) out.tsPassword = c.tsPassword;
    if (c.ksPKeyPasswd) out.ksPKeyPasswd = c.ksPKeyPasswd;
    return out;
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const connettore = this.buildConnettore();
    const creds = this.buildCredenziali();

    this.api
      .replaceConnettoreIntegrazione(this.idA2A(), connettore, this.etag)
      .pipe(
        switchMap((res) =>
          Object.keys(creds).length
            ? this.api.putConnettoreIntegrazioneCredenziali(this.idA2A(), creds).pipe(switchMap(() => of(res)))
            : of(res)
        ),
        catchError((err) => this.onError(err))
      )
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.apply(res.body);
        this.snackbar.success(this.translate.instant('Applicazioni.Connettore.Salvato'));
        this.editing.set(false);
      });
  }

  private onError(err: HttpErrorResponse) {
    this.saving.set(false);
    const key = err.status === 412 || err.status === 428 ? 'Applicazioni.Form.ConflittoConcorrenza' : 'Applicazioni.Connettore.SalvaErrore';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
