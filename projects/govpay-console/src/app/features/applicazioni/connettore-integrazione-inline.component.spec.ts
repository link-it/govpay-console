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

import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { ApplicazioniConsoleApi } from './applicazioni.console-api';
import { ConnettoreIntegrazioneInlineComponent } from './connettore-integrazione-inline.component';

function setup() {
  const getConnettoreIntegrazioneWithETag = vi.fn(() => of({ body: { abilitato: false }, etag: null }));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ConnettoreIntegrazioneInlineComponent],
    providers: [
      { provide: ApplicazioniConsoleApi, useValue: { getConnettoreIntegrazioneWithETag } },
      { provide: SnackbarService, useValue: { error: vi.fn(), success: vi.fn() } },
      { provide: TranslateService, useValue: { instant: (k: string) => k } },
    ],
  });
  TestBed.overrideComponent(ConnettoreIntegrazioneInlineComponent, { set: { template: '', imports: [] } });
  const fixture = TestBed.createComponent(ConnettoreIntegrazioneInlineComponent);
  fixture.componentRef.setInput('idA2A', 'A');
  const comp = fixture.componentInstance;
  return { comp };
}

const mreq = (comp: unknown) => (comp as { missingRequired(): boolean }).missingRequired();

describe('ConnettoreIntegrazioneInlineComponent — validità reattiva', () => {
  it('senza URL → nessun obbligo, anche con abilitato e auth valorizzati', () => {
    const { comp } = setup();
    // il gate è l'URL (come il BE), NON `abilitato`
    comp.form.patchValue({ abilitato: true, url: '', tipoAutenticazione: 'HTTPBASIC', username: '' });
    expect(mreq(comp)).toBe(false);
    comp.form.patchValue({ abilitato: false });
    expect(mreq(comp)).toBe(false);
  });

  it('URL presente richiede Versione e Tipo autenticazione', () => {
    const { comp } = setup();
    comp.form.patchValue({ url: 'https://x' }); // versione + tipoAuth ancora null
    expect(mreq(comp)).toBe(true);
    comp.form.patchValue({ versione: 'REST_V1' });
    expect(mreq(comp)).toBe(true); // manca ancora il tipo
    comp.form.patchValue({ tipoAutenticazione: 'NONE' });
    expect(mreq(comp)).toBe(false); // NONE non ha campi extra
  });

  it('URL + HTTPBASIC richiede username e password', () => {
    const { comp } = setup();
    comp.form.patchValue({ url: 'https://x', versione: 'REST_V1', tipoAutenticazione: 'HTTPBASIC' });
    expect(mreq(comp)).toBe(true);
    comp.form.patchValue({ username: 'u' });
    expect(mreq(comp)).toBe(true); // manca la password
    comp.form.patchValue({ credenziali: { password: 'p' } });
    expect(mreq(comp)).toBe(false);
  });

  it('URL + OAUTH2 richiede clientId + urlTokenEndpoint (scope opzionale)', () => {
    const { comp } = setup();
    comp.form.patchValue({ url: 'https://x', versione: 'REST_V1', tipoAutenticazione: 'OAUTH2', clientId: 'c' });
    expect(mreq(comp)).toBe(true);
    comp.form.patchValue({ urlTokenEndpoint: 'https://token' });
    expect(mreq(comp)).toBe(false);
  });

  it('URL + SSL: ks obbligatori solo se CLIENT', () => {
    const { comp } = setup();
    comp.form.patchValue({
      url: 'https://x',
      versione: 'REST_V1',
      tipoAutenticazione: 'SSL',
      sslTipo: 'SERVER',
      sslType: 'TLSv1.2',
      tsType: 'JKS',
      tsLocation: '/ts',
    });
    expect(mreq(comp)).toBe(false);
    comp.form.patchValue({ sslTipo: 'CLIENT' });
    expect(mreq(comp)).toBe(true);
    comp.form.patchValue({ ksType: 'JKS', ksLocation: '/ks' });
    expect(mreq(comp)).toBe(false);
  });
});
