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

import { beforeEach, describe, expect, it } from 'vitest';
import { SystemFacade } from './system.facade';

describe('SystemFacade — colorScheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('default = auto', () => {
    const f = new SystemFacade();
    expect(f.colorScheme()).toBe('auto');
  });

  it('setColorScheme persiste in localStorage', () => {
    const f = new SystemFacade();
    f.setColorScheme('dark');
    expect(f.colorScheme()).toBe('dark');
    expect(localStorage.getItem('lnk-color-scheme')).toBe('dark');
  });

  it('cycleColorScheme: light → dark → auto → light', () => {
    const f = new SystemFacade();
    f.setColorScheme('light');
    expect(f.cycleColorScheme()).toBe('dark');
    expect(f.cycleColorScheme()).toBe('auto');
    expect(f.cycleColorScheme()).toBe('light');
  });

  it('resolvedScheme: auto rispetta il signal _systemDark', () => {
    const f = new SystemFacade();
    f.setColorScheme('light');
    expect(f.resolvedScheme()).toBe('light');
    f.setColorScheme('dark');
    expect(f.resolvedScheme()).toBe('dark');
  });

  it('rispetta il valore persistito al boot', () => {
    localStorage.setItem('lnk-color-scheme', 'dark');
    const f = new SystemFacade();
    expect(f.colorScheme()).toBe('dark');
    expect(f.resolvedScheme()).toBe('dark');
  });
});
