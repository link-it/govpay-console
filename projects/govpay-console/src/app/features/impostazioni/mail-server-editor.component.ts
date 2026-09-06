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

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, type Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  FormActionBarComponent,
  LoadingComponent,
  PageHeaderComponent,
  ListStickyToolbarDirective,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { SecretInputComponent } from '@core/ui/secret-input/secret-input.component';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import type { ImpostazioniMailServer } from './impostazioni.model';

/**
 * Editor **Impostazioni → Server mail** (SMTP dei promemoria). GET+ETag →
 * PUT-replace con If-Match. Le password (SMTP + keystore/truststore) sono
 * write-only su endpoint dedicato; `passwordImpostata` (readOnly) indica solo
 * se una password SMTP è già configurata.
 */
@Component({
  selector: 'lnk-mail-server-editor',
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
    FormActionBarComponent,
    SecretInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mail-server-editor.component.html',
})
export class MailServerEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ImpostazioniConsoleApi);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private etag: string | null = null;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly savingPassword = signal(false);
  /** readOnly dal payload: una password SMTP è già configurata. */
  readonly passwordImpostata = signal(false);

  readonly form = this.fb.nonNullable.group({
    abilitato: [false],
    host: [''],
    port: [null as number | null],
    username: [''],
    from: [''],
    connectionTimeoutMs: [null as number | null],
    readTimeoutMs: [null as number | null],
    startTls: [false],
    // SSL
    sslAbilitato: [false],
    sslTipo: [''],
    sslHostnameVerifier: [false],
    tsLocation: [''],
    tsTipo: [''],
    tsAlgorithm: [''],
    ksLocation: [''],
    ksTipo: [''],
    ksAlgorithm: [''],
  });

  /** Sub-form credenziali write-only (3 password: SMTP, keystore, truststore). */
  readonly credForm = this.fb.nonNullable.group({
    nuovaPassword: [''],
    ksPassword: [''],
    tsPassword: [''],
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([
      { label: 'Nav.Impostazioni', url: '/impostazioni' },
      { label: 'Impostazioni.Aree.MailServer.Nome' },
    ]);
    this.loading.set(true);
    this.api
      .getMailServer()
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          this.router.navigate(['/impostazioni']);
          return of(null);
        })
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res?.body) return;
        this.etag = res.etag;
        const b = res.body;
        this.passwordImpostata.set(b.passwordImpostata ?? false);
        this.form.patchValue({
          abilitato: b.abilitato,
          host: b.host ?? '',
          port: b.port ?? null,
          username: b.username ?? '',
          from: b.from ?? '',
          connectionTimeoutMs: b.connectionTimeoutMs ?? null,
          readTimeoutMs: b.readTimeoutMs ?? null,
          startTls: b.startTls ?? false,
          sslAbilitato: b.ssl?.abilitato ?? false,
          sslTipo: b.ssl?.tipo ?? '',
          sslHostnameVerifier: b.ssl?.hostnameVerifier ?? false,
          tsLocation: b.ssl?.trustStore?.location ?? '',
          tsTipo: b.ssl?.trustStore?.tipo ?? '',
          tsAlgorithm: b.ssl?.trustStore?.managementAlgorithm ?? '',
          ksLocation: b.ssl?.keyStore?.location ?? '',
          ksTipo: b.ssl?.keyStore?.tipo ?? '',
          ksAlgorithm: b.ssl?.keyStore?.managementAlgorithm ?? '',
        });
      });
  }

  private buildBody(): ImpostazioniMailServer {
    const r = this.form.getRawValue();
    const s = (v: string): string | undefined => v.trim() || undefined;
    const keyStore = { location: s(r.ksLocation), tipo: s(r.ksTipo), managementAlgorithm: s(r.ksAlgorithm) };
    const trustStore = { location: s(r.tsLocation), tipo: s(r.tsTipo), managementAlgorithm: s(r.tsAlgorithm) };
    return {
      abilitato: r.abilitato,
      host: s(r.host),
      port: r.port ?? undefined,
      username: s(r.username),
      from: s(r.from),
      connectionTimeoutMs: r.connectionTimeoutMs ?? undefined,
      readTimeoutMs: r.readTimeoutMs ?? undefined,
      startTls: r.startTls,
      ssl: {
        abilitato: r.sslAbilitato,
        tipo: s(r.sslTipo),
        hostnameVerifier: r.sslHostnameVerifier,
        trustStore,
        keyStore,
      },
    };
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .putMailServer(this.buildBody(), this.etag)
      .pipe(catchError((err) => this.onError(err)))
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.passwordImpostata.set(res.body?.passwordImpostata ?? this.passwordImpostata());
        this.snackbar.success(this.translate.instant('Impostazioni.Salvato'));
      });
  }

  savePassword(): void {
    if (this.savingPassword()) return;
    const r = this.credForm.getRawValue();
    const s = (v: string): string | undefined => v.trim() || undefined;
    const body = { nuovaPassword: s(r.nuovaPassword), ksPassword: s(r.ksPassword), tsPassword: s(r.tsPassword) };
    if (!body.nuovaPassword && !body.ksPassword && !body.tsPassword) return;
    this.savingPassword.set(true);
    this.api
      .putMailServerPassword(body)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Impostazioni.SalvaErrore')));
          return of<'error'>('error');
        })
      )
      .subscribe((res) => {
        this.savingPassword.set(false);
        if (res === 'error') return;
        this.credForm.reset();
        if (body.nuovaPassword) this.passwordImpostata.set(true);
        this.snackbar.success(this.translate.instant('Impostazioni.MailServer.PasswordSalvata'));
      });
  }

  private onError(err: HttpErrorResponse): Observable<null> {
    this.saving.set(false);
    const key = err.status === 412 || err.status === 428 ? 'Impostazioni.ConflittoConcorrenza'
      : err.status === 422 ? 'Impostazioni.Invalido'
      : 'Impostazioni.SalvaErrore';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
