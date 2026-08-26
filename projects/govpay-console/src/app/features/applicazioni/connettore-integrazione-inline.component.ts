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

import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, InfoGridComponent, LoadingComponent, SelectComponent, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail, type ConnettoreCredenziali, type SslTipo, type TipoAutenticazioneConnettore } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { SecretInputComponent } from '@core/ui/secret-input/secret-input.component';
import { ApplicazioniConsoleApi } from './applicazioni.console-api';
import type { ConnettoreIntegrazioneApplicazione, VersioneIntegrazione } from './applicazione.model';

const TIPI_AUTH: TipoAutenticazioneConnettore[] = ['NONE', 'HTTPBASIC', 'SSL', 'HEADER', 'APIKEY', 'OAUTH2'];
const VERSIONI: VersioneIntegrazione[] = ['REST_V1', 'REST_V2'];
const SSL_TIPI: SslTipo[] = ['CLIENT', 'SERVER'];

/**
 * Card **view/edit inline** del connettore di integrazione dell'applicazione.
 * Carica da sé il connettore (+ETag), mostra la sintesi in lettura e in edit il
 * form config (campi condizionali per `tipoAutenticazione`) + credenziali
 * write-only. Salva via `replaceConnettoreIntegrazione` + `putCredenziali`.
 */
@Component({
  selector: 'lnk-connettore-integrazione-inline',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, InfoGridComponent, LoadingComponent, InlineEditCardComponent, SecretInputComponent, SelectComponent],
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
  readonly sslTipi = SSL_TIPI;

  readonly form = this.fb.nonNullable.group({
    abilitato: [false],
    url: [''],
    // nullable: null + disabilitati finché l'URL non è valorizzato
    versione: new FormControl<VersioneIntegrazione | null>(null),
    tipoAutenticazione: new FormControl<TipoAutenticazioneConnettore | null>(null),
    username: [''],
    sslTipo: ['CLIENT'],
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
    connectTimeoutMs: [null as number | null],
    readTimeoutMs: [null as number | null],
    credenziali: this.fb.nonNullable.group({
      password: [''],
      ksPassword: [''],
      tsPassword: [''],
      ksPKeyPasswd: [''],
      headerValue: [''],
      apiKey: [''],
      clientSecret: [''],
    }),
  });

  // Stato del form come signal: uso getRawValue() così i valori restano leggibili
  // anche quando Versione/Tipo auth sono disabilitati (esclusi da valueChanges).
  private readonly formValue = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  /** Tipo di autenticazione corrente (null finché il connettore non è configurato). */
  readonly authType = computed<TipoAutenticazioneConnettore | null>(() => this.formValue().tipoAutenticazione ?? null);
  protected readonly sslKind = computed(() => this.formValue().sslTipo);
  protected readonly sslIsClient = computed(() => this.sslKind() === 'CLIENT');

  /**
   * Il connettore è "configurato" quando l'URL è valorizzato: **solo allora**
   * Versione/Tipo auth sono abilitati e il BE pretende i campi obbligatori (per
   * tipo). Stessa logica della console legacy (`required = !!url`), a prescindere
   * da `abilitato`.
   */
  protected readonly hasUrl = computed(() => !!this.formValue().url?.trim());

  /**
   * Campi obbligatori mancanti come **computed puro** (signal-based): pilota il
   * disabilitamento di Salva in modo reattivo (non si può usare `form.invalid`
   * perché i validatori sono impostati in un `effect` che gira dopo la
   * valutazione del template, zoneless). Con URL vuoto nessun obbligo; con URL
   * valorizzato servono Versione, Tipo auth e i campi del tipo scelto (per
   * HTTPBASIC anche la password). Deve restare allineato a `_connettoreGating`.
   */
  protected readonly missingRequired = computed(() => {
    const v = this.formValue();
    if (!v.url?.trim()) return false; // non configurato: nessun obbligo (né lato BE)
    if (!v.versione || !v.tipoAutenticazione) return true;
    switch (v.tipoAutenticazione) {
      case 'HTTPBASIC':
        return !v.username || !v.credenziali?.password;
      case 'HEADER':
        return !v.headerName;
      case 'APIKEY':
        return !v.apiId;
      case 'OAUTH2':
        return !v.clientId || !v.urlTokenEndpoint;
      case 'SSL':
        return !v.sslType || !v.tsType || !v.tsLocation || (v.sslTipo === 'CLIENT' && (!v.ksType || !v.ksLocation));
      default:
        return false;
    }
  });

  /**
   * Aggancia Versione/Tipo auth alla presenza dell'URL: abilitati con URL,
   * azzerati e disabilitati senza. Imposta i `Validators.required` per tipo
   * (credenziali opzionali, tranne la password HTTP Basic). Esegue solo
   * transizioni reali per non entrare in loop.
   */
  private readonly _connettoreGating = effect(() => {
    const on = this.hasUrl();
    const auth = on ? this.authType() : null;
    const ssl = auth === 'SSL';
    const c = this.form.controls;
    const req = (ctrl: AbstractControl, need: boolean) => {
      ctrl.setValidators(need ? Validators.required : null);
      ctrl.updateValueAndValidity({ emitEvent: false });
    };
    if (on) {
      if (c.versione.disabled) c.versione.enable({ emitEvent: false });
      if (c.tipoAutenticazione.disabled) c.tipoAutenticazione.enable({ emitEvent: false });
    } else {
      if (c.versione.value !== null) c.versione.setValue(null, { emitEvent: true });
      if (c.tipoAutenticazione.value !== null) c.tipoAutenticazione.setValue(null, { emitEvent: true });
      if (c.versione.enabled) c.versione.disable({ emitEvent: false });
      if (c.tipoAutenticazione.enabled) c.tipoAutenticazione.disable({ emitEvent: false });
    }
    req(c.versione, on);
    req(c.tipoAutenticazione, on);
    req(c.username, auth === 'HTTPBASIC');
    req(c.credenziali.controls.password, auth === 'HTTPBASIC');
    req(c.headerName, auth === 'HEADER');
    req(c.apiId, auth === 'APIKEY');
    req(c.clientId, auth === 'OAUTH2');
    req(c.urlTokenEndpoint, auth === 'OAUTH2');
    req(c.sslType, ssl);
    req(c.tsType, ssl);
    req(c.tsLocation, ssl);
    req(c.ksType, ssl && this.sslKind() === 'CLIENT');
    req(c.ksLocation, ssl && this.sslKind() === 'CLIENT');
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
    // Senza URL il connettore non è configurato: Versione/Tipo auth restano null
    // (coerente col gating), anche se il payload arrivasse incoerente.
    const configured = !!c.url?.trim();
    this.form.patchValue({
      abilitato: c.abilitato,
      url: c.url ?? '',
      versione: configured ? c.versione ?? null : null,
      tipoAutenticazione: configured ? c.tipoAutenticazione ?? null : null,
      username: c.username ?? '',
      sslTipo: c.sslTipo ?? 'CLIENT',
      ksLocation: c.ksLocation ?? '',
      ksType: c.ksType ?? '',
      tsLocation: c.tsLocation ?? '',
      tsType: c.tsType ?? '',
      sslType: c.sslType ?? '',
      headerName: c.headerName ?? '',
      apiId: c.apiId ?? '',
      clientId: c.clientId ?? '',
      scope: c.scope ?? '',
      urlTokenEndpoint: c.urlTokenEndpoint ?? '',
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
    // Campi comuni; quelli di auth dipendono dal tipoAutenticazione.
    const out: ConnettoreIntegrazioneApplicazione = {
      abilitato: r.abilitato,
      url: r.url || undefined,
      versione: r.versione ?? undefined,
      tipoAutenticazione: r.tipoAutenticazione ?? undefined,
      connectTimeoutMs: r.connectTimeoutMs ?? undefined,
      readTimeoutMs: r.readTimeoutMs ?? undefined,
    };
    switch (r.tipoAutenticazione) {
      case 'HTTPBASIC':
        out.username = r.username || undefined;
        break;
      case 'SSL':
        out.sslTipo = (r.sslTipo as SslTipo) || undefined;
        out.ksLocation = r.ksLocation || undefined;
        out.ksType = r.ksType || undefined;
        out.tsLocation = r.tsLocation || undefined;
        out.tsType = r.tsType || undefined;
        out.sslType = r.sslType || undefined;
        break;
      case 'HEADER':
        out.headerName = r.headerName || undefined;
        break;
      case 'APIKEY':
        out.apiId = r.apiId || undefined;
        break;
      case 'OAUTH2':
        out.clientId = r.clientId || undefined;
        out.scope = r.scope || undefined;
        out.urlTokenEndpoint = r.urlTokenEndpoint || undefined;
        break;
    }
    return out;
  }

  private buildCredenziali(): ConnettoreCredenziali {
    const c = this.form.controls.credenziali.getRawValue();
    const out: ConnettoreCredenziali = {};
    if (c.password) out.password = c.password;
    if (c.ksPassword) out.ksPassword = c.ksPassword;
    if (c.tsPassword) out.tsPassword = c.tsPassword;
    if (c.ksPKeyPasswd) out.ksPKeyPasswd = c.ksPKeyPasswd;
    if (c.headerValue) out.headerValue = c.headerValue;
    if (c.apiKey) out.apiKey = c.apiKey;
    if (c.clientSecret) out.clientSecret = c.clientSecret;
    return out;
  }

  save(): void {
    if (this.saving() || this.missingRequired()) return;
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
