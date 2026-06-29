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
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  it('aggiunge messaggi alla coda con id incrementale', () => {
    const svc = new SnackbarService();
    const id1 = svc.show('uno', 'info', 0);
    const id2 = svc.success('due', 0);
    expect(svc.messages().map((m) => m.id)).toEqual([id1, id2]);
    expect(svc.messages()[0].text).toBe('uno');
    expect(svc.messages()[1].level).toBe('success');
  });

  it('rimuove messaggio con dismiss', () => {
    const svc = new SnackbarService();
    const id = svc.error('boom', 0);
    svc.dismiss(id);
    expect(svc.messages()).toHaveLength(0);
  });

  it('clear svuota la coda', () => {
    const svc = new SnackbarService();
    svc.info('a', 0);
    svc.info('b', 0);
    svc.clear();
    expect(svc.messages()).toHaveLength(0);
  });

  it('auto-dismiss dopo duration', () => {
    vi.useFakeTimers();
    const svc = new SnackbarService();
    svc.show('temporaneo', 'info', 1000);
    expect(svc.messages()).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(svc.messages()).toHaveLength(0);
    vi.useRealTimers();
  });
});
