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
import { catchError, map, of, switchMap, type Observable } from 'rxjs';
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
import {
  ConnettoreAuthFieldsComponent,
  buildAuthGroup,
  buildConnettoreAuth,
  buildConnettoreCredenziali,
  buildCredenzialiGroup,
} from '@core/ui/connettore-auth-fields/connettore-auth-fields.component';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import type { ImpostazioniServizioGDE } from './impostazioni.model';

/**
 * Editor **Impostazioni → Servizio GDE** (connettore verso il Giornale
 * Eventi). GET+ETag → PUT-replace con If-Match; auth + credenziali write-only
 * con la stessa modalità dei connettori degli intermediari
 * ({@link ConnettoreAuthFieldsComponent}).
 */
@Component({
  selector: 'lnk-servizio-gde-editor',
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
    ConnettoreAuthFieldsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servizio-gde-editor.component.html',
})
export class ServizioGdeEditorComponent implements OnInit {
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
    url: [''],
    auth: buildAuthGroup(this.fb),
    credenziali: buildCredenzialiGroup(this.fb),
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([
      { label: 'Nav.Impostazioni', url: '/impostazioni' },
      { label: 'Impostazioni.Aree.ServizioGde.Nome' },
    ]);
    this.loading.set(true);
    this.api
      .getServizioGde()
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
        this.form.patchValue({ abilitato: b.abilitato, url: b.url ?? '' });
        this.form.controls.auth.patchValue({
          tipoAutenticazione: b.auth?.tipoAutenticazione ?? 'NONE',
          username: b.auth?.username ?? '',
          sslTipo: b.auth?.sslTipo ?? 'CLIENT',
          ksLocation: b.auth?.ksLocation ?? '',
          ksType: b.auth?.ksType ?? '',
          tsLocation: b.auth?.tsLocation ?? '',
          tsType: b.auth?.tsType ?? '',
          sslType: b.auth?.sslType ?? '',
          headerName: b.auth?.headerName ?? '',
          apiId: b.auth?.apiId ?? '',
          clientId: b.auth?.clientId ?? '',
          scope: b.auth?.scope ?? '',
          urlTokenEndpoint: b.auth?.urlTokenEndpoint ?? '',
        });
        this.form.controls.credenziali.reset();
      });
  }

  private buildBody(): ImpostazioniServizioGDE {
    const r = this.form.getRawValue();
    return {
      abilitato: r.abilitato,
      url: r.url.trim() || undefined,
      auth: buildConnettoreAuth(r.auth as Record<string, string>),
    };
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const creds = buildConnettoreCredenziali(this.form.getRawValue().credenziali as Record<string, string>);
    this.api
      .putServizioGde(this.buildBody(), this.etag)
      .pipe(
        switchMap((res) =>
          Object.keys(creds).length
            ? this.api.putServizioGdeCredenziali(creds).pipe(map(() => res))
            : of(res)
        ),
        catchError((err) => this.onError(err))
      )
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.form.controls.credenziali.reset();
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
