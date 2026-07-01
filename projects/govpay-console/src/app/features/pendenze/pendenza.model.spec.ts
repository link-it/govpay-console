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
import {
  STATO_AVVISO_LABEL,
  STATO_PENDENZA_COLOR,
  STATO_PENDENZA_LABEL,
  STATO_VOCE_PENDENZA_COLOR,
  STATO_VOCE_PENDENZA_LABEL,
  type StatoAvviso,
  type StatoPendenza,
  type StatoVocePendenza,
} from './pendenza.model';

const STATI_PENDENZA: StatoPendenza[] = [
  'NON_PAGATA', 'PAGATA', 'PAGATA_PARZIALE', 'ANNULLATA', 'SCADUTA', 'RICONCILIATA', 'ANOMALA',
];
const STATI_VOCE: StatoVocePendenza[] = ['NON_PAGATA', 'PAGATA', 'ANOMALA'];
const STATI_AVVISO: StatoAvviso[] = ['PAGATO', 'NON_PAGATO', 'SCADUTO', 'ANNULLATO'];

describe('pendenza.model — mappe di presentazione', () => {
  it('ogni stato pendenza ha label i18n e tono badge', () => {
    for (const s of STATI_PENDENZA) {
      expect(STATO_PENDENZA_LABEL[s]).toMatch(/^Pendenze\.Stati\./);
      expect(STATO_PENDENZA_COLOR[s]).toBeTruthy();
    }
    expect(Object.keys(STATO_PENDENZA_LABEL).sort()).toEqual([...STATI_PENDENZA].sort());
    expect(Object.keys(STATO_PENDENZA_COLOR).sort()).toEqual([...STATI_PENDENZA].sort());
  });

  it('gli stati pagati/riconciliati sono verdi, anomala è danger', () => {
    expect(STATO_PENDENZA_COLOR.PAGATA).toBe('success');
    expect(STATO_PENDENZA_COLOR.RICONCILIATA).toBe('success');
    expect(STATO_PENDENZA_COLOR.ANOMALA).toBe('danger');
    expect(STATO_PENDENZA_COLOR.SCADUTA).toBe('warning');
    expect(STATO_PENDENZA_COLOR.ANNULLATA).toBe('muted');
  });

  it('ogni stato voce ha label i18n e tono badge', () => {
    for (const s of STATI_VOCE) {
      expect(STATO_VOCE_PENDENZA_LABEL[s]).toMatch(/^Pendenze\.StatiVoce\./);
      expect(STATO_VOCE_PENDENZA_COLOR[s]).toBeTruthy();
    }
  });

  it('ogni stato avviso ha label i18n', () => {
    for (const s of STATI_AVVISO) {
      expect(STATO_AVVISO_LABEL[s]).toMatch(/^Pendenze\.StatiAvviso\./);
    }
  });
});
