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
import type { ConnettoreAuth, TipoAutenticazioneConnettore } from '@core/models';
import { SetPasswordCardComponent } from '@core/ui/set-password-card/set-password-card.component';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import type { ImpostazioniAppIoServer } from './impostazioni.model';

const TIPI_AUTH: TipoAutenticazioneConnettore[] = ['NONE', 'HTTPBASIC', 'SSL', 'HEADER', 'APIKEY', 'OAUTH2'];

/**
 * Editor **Impostazioni → Server App IO** (connettore push). GET+ETag →
 * PUT-replace con If-Match. Credenziali write-only su endpoint dedicato.
 */
@Component({
  selector: 'lnk-app-io-server-editor',
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
  templateUrl: './app-io-server-editor.component.html',
})
export class AppIoServerEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ImpostazioniConsoleApi);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private etag: string | null = null;
  private loadedAuth: ConnettoreAuth | null = null;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly tipiAuth = TIPI_AUTH;

  readonly form = this.fb.nonNullable.group({
    abilitato: [false],
    url: [''],
    timeToLiveSecondi: [null as number | null],
    tipoAutenticazione: ['NONE' as TipoAutenticazioneConnettore],
    username: [''],
  });

  readonly showCredenziali = computed(() => this.form.controls.tipoAutenticazione.value !== 'NONE');

  readonly submitCredenziali = (nuovaPassword: string): Observable<void> =>
    this.api.putAppIoServerCredenziali({ password: nuovaPassword });

  ngOnInit(): void {
    this.system.setBreadcrumbs([
      { label: 'Nav.Impostazioni', url: '/impostazioni' },
      { label: 'Impostazioni.Aree.AppIoServer.Nome' },
    ]);
    this.loading.set(true);
    this.api
      .getAppIoServer()
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
        this.loadedAuth = b.auth ?? null;
        this.form.patchValue({
          abilitato: b.abilitato,
          url: b.url ?? '',
          timeToLiveSecondi: b.timeToLiveSecondi ?? null,
          tipoAutenticazione: b.auth?.tipoAutenticazione ?? 'NONE',
          username: b.auth?.username ?? '',
        });
      });
  }

  private buildBody(): ImpostazioniAppIoServer {
    const r = this.form.getRawValue();
    const s = (v: string): string | undefined => v.trim() || undefined;
    const auth: ConnettoreAuth = {
      ...(this.loadedAuth ?? {}),
      tipoAutenticazione: r.tipoAutenticazione,
      username: s(r.username),
    };
    return {
      abilitato: r.abilitato,
      url: s(r.url),
      timeToLiveSecondi: r.timeToLiveSecondi ?? undefined,
      auth: r.tipoAutenticazione === 'NONE' && !this.loadedAuth ? undefined : auth,
    };
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .putAppIoServer(this.buildBody(), this.etag)
      .pipe(catchError((err) => this.onError(err)))
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.loadedAuth = res.body?.auth ?? this.loadedAuth;
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

  authLabel(tipo: string): string {
    return this.translate.instant(`Impostazioni.ServizioGde.Auth.${tipo}`);
  }
}
