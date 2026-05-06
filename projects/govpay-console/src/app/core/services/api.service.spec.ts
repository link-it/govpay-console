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

import { describe, expect, it } from 'vitest';
import { ApiService } from './api.service';

describe('ApiService.URL_BY_TIPO', () => {
  it('mappa tutti i TipoOggetto a un segmento URL non vuoto e senza slash iniziali/finali', () => {
    for (const segment of Object.values(ApiService.URL_BY_TIPO)) {
      expect(segment).toBeTruthy();
      expect(segment.startsWith('/')).toBe(false);
      expect(segment.endsWith('/')).toBe(false);
    }
  });

  it('contiene i segmenti legacy GovPay (vedi `govpay-console-github/util.service.ts`)', () => {
    expect(ApiService.URL_BY_TIPO.pendenze).toBe('pendenze');
    expect(ApiService.URL_BY_TIPO.ricevute).toBe('rpp');
    expect(ApiService.URL_BY_TIPO.giornaleEventi).toBe('eventi');
    expect(ApiService.URL_BY_TIPO.tipiPendenze).toBe('tipiPendenza');
    expect(ApiService.URL_BY_TIPO.registroIntermediari).toBe('intermediari');
    expect(ApiService.URL_BY_TIPO.rendicontazioni).toBe('flussiRendicontazione');
    expect(ApiService.URL_BY_TIPO.tracciati).toBe('pendenze/tracciati');
  });
});
