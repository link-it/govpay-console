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

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { SelectComponent } from '@linkit/shared-ui';
import type { ConnettoreAuth, ConnettoreCredenziali, SslTipo, TipoAutenticazioneConnettore } from '@core/models';
import { SecretInputComponent } from '@core/ui/secret-input/secret-input.component';

/** Tipi di autenticazione del connettore (stessi valori degli intermediari). */
export const TIPI_AUTH: TipoAutenticazioneConnettore[] = ['NONE', 'HTTPBASIC', 'SSL', 'HEADER', 'APIKEY', 'OAUTH2'];
/** Modalità SSL. */
export const SSL_TIPI: string[] = ['CLIENT', 'SERVER'];

/** Controlli del FormGroup `auth` attesi dal componente. */
export function buildAuthGroup(fb: import('@angular/forms').FormBuilder): FormGroup {
  return fb.nonNullable.group({
    tipoAutenticazione: ['NONE' as TipoAutenticazioneConnettore],
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
  });
}

/** Controlli del FormGroup `credenziali` (write-only) attesi dal componente. */
export function buildCredenzialiGroup(fb: import('@angular/forms').FormBuilder): FormGroup {
  return fb.nonNullable.group({
    subscriptionKey: [''],
    password: [''],
    ksPassword: [''],
    tsPassword: [''],
    ksPKeyPasswd: [''],
    headerValue: [''],
    apiKey: [''],
    clientSecret: [''],
  });
}

/**
 * Costruisce `ConnettoreAuth` dai valori del form `auth`, includendo solo i
 * campi pertinenti al `tipoAutenticazione` selezionato (come negli intermediari).
 */
export function buildConnettoreAuth(a: Record<string, string>): ConnettoreAuth {
  const auth: ConnettoreAuth = { tipoAutenticazione: a['tipoAutenticazione'] as TipoAutenticazioneConnettore };
  const set = (k: keyof ConnettoreAuth, v: string) => {
    if (v) (auth as unknown as Record<string, unknown>)[k] = v;
  };
  switch (auth.tipoAutenticazione) {
    case 'HTTPBASIC': set('username', a['username']); break;
    case 'HEADER': set('headerName', a['headerName']); break;
    case 'APIKEY': set('apiId', a['apiId']); break;
    case 'OAUTH2': set('clientId', a['clientId']); set('scope', a['scope']); set('urlTokenEndpoint', a['urlTokenEndpoint']); break;
    case 'SSL':
      auth.sslTipo = a['sslTipo'] as SslTipo;
      set('ksLocation', a['ksLocation']); set('ksType', a['ksType']);
      set('tsLocation', a['tsLocation']); set('tsType', a['tsType']); set('sslType', a['sslType']);
      break;
  }
  return auth;
}

/** Costruisce `ConnettoreCredenziali` dai valori non vuoti del form credenziali. */
export function buildConnettoreCredenziali(c: Record<string, string>): ConnettoreCredenziali {
  const out: ConnettoreCredenziali = {};
  for (const [k, v] of Object.entries(c)) {
    if (v) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/**
 * Campi di **autenticazione + credenziali di un connettore**, con la stessa
 * modalità d'inserimento dei connettori degli intermediari: select del
 * `tipoAutenticazione` + campi condizionali per tipo (username / SSL keystore /
 * header / apiId / OAuth2) e le credenziali segrete write-only correlate.
 *
 * Il componente **non possiede** i form: riceve i due `FormGroup` (auth e
 * credenziali) dal chiamante e li rende. Il chiamante li costruisce con
 * {@link buildAuthGroup}/{@link buildCredenzialiGroup} e ne gestisce
 * patch/build/save.
 */
@Component({
  selector: 'lnk-connettore-auth-fields',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, SelectComponent, SecretInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connettore-auth-fields.component.html',
})
export class ConnettoreAuthFieldsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly authGroup = input.required<FormGroup>();
  readonly credenzialiGroup = input.required<FormGroup>();

  readonly tipiAuth = TIPI_AUTH;
  readonly sslTipi = SSL_TIPI;

  readonly authType = signal<TipoAutenticazioneConnettore>('NONE');

  ngOnInit(): void {
    const ctrl = this.authGroup().get('tipoAutenticazione');
    if (!ctrl) return;
    this.authType.set(ctrl.value);
    ctrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.authType.set(v));
  }
}
