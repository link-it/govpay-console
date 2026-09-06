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
import { SetPasswordCardComponent } from '@core/ui/set-password-card/set-password-card.component';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import type { ImpostazioniHardening } from './impostazioni.model';

/**
 * Editor **Impostazioni → Hardening** (Google reCAPTCHA login). GET+ETag →
 * PUT-replace con If-Match. La `secretKey` è write-only su endpoint dedicato.
 */
@Component({
  selector: 'lnk-hardening-editor',
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
    SetPasswordCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hardening-editor.component.html',
})
export class HardeningEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ImpostazioniConsoleApi);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private etag: string | null = null;

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    abilitato: [false],
    serverURL: [''],
    siteKey: [''],
    soglia: [null as number | null],
    parametro: [''],
    denyOnFail: [false],
    connectionTimeoutMs: [null as number | null],
    readTimeoutMs: [null as number | null],
  });

  readonly submitSecret = (secretKey: string): Observable<void> =>
    this.api.putHardeningCredenziali({ secretKey });

  ngOnInit(): void {
    this.system.setBreadcrumbs([
      { label: 'Nav.Impostazioni', url: '/impostazioni' },
      { label: 'Impostazioni.Aree.Hardening.Nome' },
    ]);
    this.loading.set(true);
    this.api
      .getHardening()
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
        const c = res.body.captcha ?? {};
        this.form.patchValue({
          abilitato: res.body.abilitato,
          serverURL: c.serverURL ?? '',
          siteKey: c.siteKey ?? '',
          soglia: c.soglia ?? null,
          parametro: c.parametro ?? '',
          denyOnFail: c.denyOnFail ?? false,
          connectionTimeoutMs: c.connectionTimeoutMs ?? null,
          readTimeoutMs: c.readTimeoutMs ?? null,
        });
      });
  }

  private buildBody(): ImpostazioniHardening {
    const r = this.form.getRawValue();
    const s = (v: string): string | undefined => v.trim() || undefined;
    return {
      abilitato: r.abilitato,
      captcha: {
        serverURL: s(r.serverURL),
        siteKey: s(r.siteKey),
        soglia: r.soglia ?? undefined,
        parametro: s(r.parametro),
        denyOnFail: r.denyOnFail,
        connectionTimeoutMs: r.connectionTimeoutMs ?? undefined,
        readTimeoutMs: r.readTimeoutMs ?? undefined,
      },
    };
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .putHardening(this.buildBody(), this.etag)
      .pipe(catchError((err) => this.onError(err)))
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.snackbar.success(this.translate.instant('Impostazioni.Salvato'));
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
