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
import { type NavItem, filterNav, flattenMobile, NAV_ITEMS } from './nav';
import type { AppConfig } from '@core/config';

const cfg = (features: Record<string, boolean> = {}): AppConfig =>
  ({
    app: { name: 'a', title: 't', version: '1' },
    STANDALONE: true,
    GOVAPI: { GOVPAY: '/api' },
    Auth: { Modes: ['Basic'], Default: 'Basic', Endpoints: {} },
    Layout: { showHeaderBar: true, showFooterBar: false, profileMenuPosition: 'sidebar' },
    Features: features,
  }) as AppConfig;

describe('filterNav', () => {
  it('rimuove voci con feature disabilitato (e i loro figli)', () => {
    const out = filterNav(NAV_ITEMS, cfg({ GESTIONE_PAGAMENTI: false, GESTIONE_RISCOSSIONI: true }), null);
    expect(out.find((i) => i.label === 'Nav.Pagamenti')).toBeUndefined();
    expect(out.find((i) => i.label === 'Nav.Riconciliazioni')).toBeDefined();
  });

  it('rimuove un nodo accordion senza figli visibili', () => {
    const items: NavItem[] = [
      {
        label: 'Empty',
        icon: 'i',
        children: [
          { label: 'C1', icon: 'i', route: '/c1', acl: ['hasGdE'] },
          { label: 'C2', icon: 'i', route: '/c2', acl: ['hasGdE'] },
        ],
      },
    ];
    expect(filterNav(items, cfg(), { hasGdE: false }).length).toBe(0);
  });

  it('mantiene foglie e gruppi quando ACL utente concede uno dei flag richiesti', () => {
    const items: NavItem[] = [
      {
        label: 'Pagamenti',
        icon: 'i',
        children: [
          { label: 'Pendenze', icon: 'i', route: '/p', acl: ['hasPendenze', 'hasPagamentiePendenze'] },
        ],
      },
    ];
    const out = filterNav(items, cfg(), { hasPendenze: true });
    expect(out[0].children?.length).toBe(1);
  });

  it('senza utente loggato mostra tutto (i guard proteggeranno)', () => {
    const items: NavItem[] = [{ label: 'X', icon: 'i', route: '/x', acl: ['hasConfig'] }];
    expect(filterNav(items, cfg(), null).length).toBe(1);
  });
});

describe('flattenMobile', () => {
  it('estrae solo le voci mobile=true (max 4) cercando anche tra i figli', () => {
    const items: NavItem[] = [
      { label: 'A', icon: 'i', route: '/a', mobile: true },
      {
        label: 'Group',
        icon: 'i',
        children: [
          { label: 'B', icon: 'i', route: '/b', mobile: true },
          { label: 'C', icon: 'i', route: '/c', mobile: true },
        ],
      },
      { label: 'D', icon: 'i', route: '/d' },
      { label: 'E', icon: 'i', route: '/e', mobile: true },
      { label: 'F', icon: 'i', route: '/f', mobile: true }, // 5° → escluso
    ];
    const out = flattenMobile(items);
    expect(out.map((i) => i.label)).toEqual(['A', 'B', 'C', 'E']);
  });

  it('NAV_ITEMS produce voci mobile non vuote', () => {
    expect(flattenMobile(NAV_ITEMS).length).toBeGreaterThan(0);
  });
});
