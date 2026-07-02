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
import { catchError, map, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { InfoGridComponent, LoadingComponent, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { NoAutofillDirective } from './no-autofill.directive';
import { IntermediariConsoleApi } from './intermediari.console-api';
import type {
  Connettore,
  ConnettoreAuth,
  ConnettoreCredenziali,
  SslTipo,
  TipoAutenticazioneConnettore,
  TipoConnettore,
} from './intermediario.model';

const TIPI_AUTH: TipoAutenticazioneConnettore[] = ['NONE', 'HTTPBASIC', 'SSL', 'HEADER', 'APIKEY', 'OAUTH2'];
const SSL_TIPI: SslTipo[] = ['CLIENT', 'SERVER'];
const CONNETTORE_LABEL: Record<string, string> = {
  'pagopa': 'Intermediari.Connettori.Tipi.Pagopa',
  'pagopa-aca': 'Intermediari.Connettori.Tipi.PagopaAca',
  'pagopa-gpd': 'Intermediari.Connettori.Tipi.PagopaGpd',
  'pagopa-fr': 'Intermediari.Connettori.Tipi.PagopaFr',
  'pagopa-backoffice-ec': 'Intermediari.Connettori.Tipi.PagopaBackofficeEc',
  'pagopa-recupero-rt': 'Intermediari.Connettori.Tipi.PagopaRecuperoRt',
};

/**
 * Card di **visualizzazione e modifica inline** di un singolo connettore pagoPA.
 * Carica da sé il connettore (+ ETag), mostra la sintesi in lettura e, in edit,
 * il form config (campi condizionali per `tipoAutenticazione`) + credenziali
 * write-only. Salva via `replaceConnettore` (If-Match) + `putConnettoreCredenziali`.
 */
@Component({
  selector: 'lnk-connettore-inline',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, InfoGridComponent, LoadingComponent, InlineEditCardComponent, NoAutofillDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './connettore-inline.component.html',
})
export class ConnettoreInlineComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(IntermediariConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idIntermediario = input.required<string>();
  readonly tipo = input.required<TipoConnettore>();

  private etag: string | null = null;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly connettore = signal<Connettore | null>(null);

  readonly tipiAuth = TIPI_AUTH;
  readonly sslTipi = SSL_TIPI;
  readonly isPagopa = computed(() => this.tipo() === 'pagopa');
  readonly title = computed(() => this.translate.instant(CONNETTORE_LABEL[this.tipo()] ?? this.tipo()));

  readonly viewItems = computed<InfoGridItem[]>(() => {
    const c = this.connettore();
    if (!c) return [{ labelKey: 'Intermediari.Connettori.Stato', value: this.translate.instant('Intermediari.Connettori.NonConfigurato') }];
    return [
      { labelKey: 'Intermediari.Connettori.Stato', value: c.abilitato ? this.translate.instant('Common.Yes') : this.translate.instant('Common.No') },
      { labelKey: 'Intermediari.Connettori.TipoAuth', value: c.auth?.tipoAutenticazione },
      { labelKey: 'Intermediari.Connettori.Url', value: c.urlRPT || c.url, mono: true, wide: true, hide: !(c.urlRPT || c.url) },
    ];
  });

  readonly form = this.fb.nonNullable.group({
    abilitato: [false],
    url: [''],
    urlRPT: [''],
    abilitaGDE: [false],
    auth: this.fb.nonNullable.group({
      tipoAutenticazione: ['NONE' as TipoAutenticazioneConnettore],
      username: [''],
      sslTipo: ['CLIENT' as SslTipo],
      ksLocation: [''],
      ksType: [''],
      tsLocation: [''],
      tsType: [''],
      sslType: [''],
      headerName: [''],
      apiId: [''],
      clientId: [''],
      scope: [''],
      urlTokenEndpoint: [''],
    }),
    credenziali: this.fb.nonNullable.group({
      subscriptionKey: [''],
      password: [''],
      ksPassword: [''],
      tsPassword: [''],
      ksPKeyPasswd: [''],
      headerValue: [''],
      apiKey: [''],
      clientSecret: [''],
    }),
  });

  readonly authType = toSignal(this.form.controls.auth.controls.tipoAutenticazione.valueChanges, {
    initialValue: 'NONE' as TipoAutenticazioneConnettore,
  });

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.api
      .getConnettoreWithETag(this.idIntermediario(), this.tipo())
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.apply(res.body);
      });
  }

  /** Popola form + vista dal connettore caricato. */
  private apply(c: Connettore): void {
    this.connettore.set(c);
    this.form.patchValue({
      abilitato: c.abilitato,
      url: c.url ?? '',
      urlRPT: c.urlRPT ?? '',
      abilitaGDE: c.abilitaGDE ?? false,
      auth: {
        tipoAutenticazione: c.auth?.tipoAutenticazione ?? 'NONE',
        username: c.auth?.username ?? '',
        sslTipo: c.auth?.sslTipo ?? 'CLIENT',
        ksLocation: c.auth?.ksLocation ?? '',
        ksType: c.auth?.ksType ?? '',
        tsLocation: c.auth?.tsLocation ?? '',
        tsType: c.auth?.tsType ?? '',
        sslType: c.auth?.sslType ?? '',
        headerName: c.auth?.headerName ?? '',
        apiId: c.auth?.apiId ?? '',
        clientId: c.auth?.clientId ?? '',
        scope: c.auth?.scope ?? '',
        urlTokenEndpoint: c.auth?.urlTokenEndpoint ?? '',
      },
    });
    this.form.controls.credenziali.reset();
  }

  onCancel(): void {
    const c = this.connettore();
    if (c) this.apply(c);
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const connettore = this.buildConnettore();
    const creds = this.buildCredenziali();

    this.api
      .replaceConnettore(this.idIntermediario(), this.tipo(), connettore, this.etag)
      .pipe(
        switchMap((res) =>
          Object.keys(creds).length
            ? this.api.putConnettoreCredenziali(this.idIntermediario(), this.tipo(), creds).pipe(map(() => res))
            : of(res)
        ),
        catchError((err: HttpErrorResponse) => {
          const key = err.status === 412 || err.status === 428 ? 'Intermediari.Form.ConflittoConcorrenza' : 'Intermediari.Form.SalvaErrore';
          this.snackbar.error(problemDetail(err, this.translate.instant(key)));
          return of(null);
        })
      )
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.apply(res.body);
        this.editing.set(false);
        this.snackbar.success(this.translate.instant('Intermediari.Connettori.Form.Salvato'));
      });
  }

  private buildConnettore(): Connettore {
    const raw = this.form.getRawValue();
    const a = raw.auth;
    const auth: ConnettoreAuth = { tipoAutenticazione: a.tipoAutenticazione };
    const set = (k: keyof ConnettoreAuth, v: string) => {
      if (v) (auth as unknown as Record<string, unknown>)[k] = v;
    };
    switch (a.tipoAutenticazione) {
      case 'HTTPBASIC': set('username', a.username); break;
      case 'HEADER': set('headerName', a.headerName); break;
      case 'APIKEY': set('apiId', a.apiId); break;
      case 'OAUTH2': set('clientId', a.clientId); set('scope', a.scope); set('urlTokenEndpoint', a.urlTokenEndpoint); break;
      case 'SSL':
        auth.sslTipo = a.sslTipo;
        set('ksLocation', a.ksLocation); set('ksType', a.ksType);
        set('tsLocation', a.tsLocation); set('tsType', a.tsType); set('sslType', a.sslType);
        break;
    }
    const c: Connettore = { abilitato: raw.abilitato, auth };
    if (this.isPagopa()) {
      if (raw.urlRPT) c.urlRPT = raw.urlRPT;
    } else {
      if (raw.url) c.url = raw.url;
      c.abilitaGDE = raw.abilitaGDE;
    }
    return c;
  }

  private buildCredenziali(): ConnettoreCredenziali {
    const raw = this.form.getRawValue().credenziali;
    const creds: ConnettoreCredenziali = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v) (creds as Record<string, unknown>)[k] = v;
    }
    return creds;
  }
}
