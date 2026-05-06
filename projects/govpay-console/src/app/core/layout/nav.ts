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

import type { AuthAcl } from '@core/auth';
import type { AppConfig } from '@core/config';

/**
 * Voce di navigazione della sidebar.
 *
 * Questa lista è hardcoded perché ogni voce è strettamente legata al codice
 * (route, componente, traduzione, ACL): tenerla nel codice riduce la sincronia
 * implicita tra config e implementazione. Le visibilità *runtime* (flag tenant
 * e permessi utente) sono gestite tramite `feature` e `acl`.
 */
export interface NavItem {
  /** Chiave i18n per l'etichetta (es. `'Nav.Dashboard'`). Risolta nei template via `translate`. */
  label: string;
  /** Nome icona registrato in `APP_ICONS`. */
  icon: string;
  /** Rotta interna; assente per gruppi che servono solo come accordion. */
  route?: string;
  /** Voci figlie: trasformano la voce in accordion (espanso) o flyout (collassato). */
  children?: NavItem[];
  /** Nome del flag in `AppConfig.Features` che ne determina la visibilità. */
  feature?: string;
  /** Permesso `AuthAcl` richiesto (almeno uno tra quelli elencati). */
  acl?: (keyof AuthAcl)[];
  /** Visibile nella mobile bottom-nav (max 4). */
  mobile?: boolean;
}

/**
 * Albero di navigazione GovPay Console.
 * Allineato alle sezioni della console legacy + raggruppamento per area funzionale.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Nav.Dashboard',
    icon: 'bootstrapHouseDoor',
    route: '/dashboard',
    mobile: true,
  },
  {
    label: 'Nav.Pagamenti',
    icon: 'bootstrapCreditCard2Front',
    feature: 'GESTIONE_PAGAMENTI',
    mobile: true,
    children: [
      { label: 'Nav.Pendenze', icon: 'bootstrapReceipt', route: '/pendenze', acl: ['hasPendenze', 'hasPagamentiePendenze'] },
      { label: 'Nav.Ricevute', icon: 'bootstrapFileEarmarkText', route: '/ricevute' },
      { label: 'Nav.Pagamenti', icon: 'bootstrapCreditCard2Front', route: '/pagamenti', acl: ['hasPagamenti', 'hasPagamentiePendenze'] },
    ],
  },
  {
    label: 'Nav.Riconciliazioni',
    icon: 'bootstrapBank',
    feature: 'GESTIONE_RISCOSSIONI',
    children: [
      { label: 'Nav.Riscossioni', icon: 'bootstrapBank', route: '/riscossioni', acl: ['hasRendiIncassi'] },
      { label: 'Nav.Rendicontazioni', icon: 'bootstrapList', route: '/rendicontazioni', acl: ['hasRendiIncassi'] },
      { label: 'Nav.Incassi', icon: 'bootstrapArchive', route: '/incassi', acl: ['hasRendiIncassi'] },
    ],
  },
  {
    label: 'Nav.Monitoraggio',
    icon: 'bootstrapClockHistory',
    children: [
      { label: 'Nav.GiornaleEventi', icon: 'bootstrapClockHistory', route: '/giornale-eventi', acl: ['hasGdE'] },
      { label: 'Nav.Tracciati', icon: 'bootstrapFolder', route: '/tracciati' },
    ],
  },
  {
    label: 'Nav.Anagrafiche',
    icon: 'bootstrapCollection',
    children: [
      { label: 'Nav.Domini', icon: 'bootstrapBuilding', route: '/domini', acl: ['hasConfig'] },
      { label: 'Nav.TipiPendenza', icon: 'bootstrapCollection', route: '/tipi-pendenza', acl: ['hasConfig'] },
      { label: 'Nav.Applicazioni', icon: 'bootstrapShieldCheck', route: '/applicazioni', acl: ['hasApplicazioni'] },
      { label: 'Nav.RegistroIntermediari', icon: 'bootstrapBank', route: '/registro-intermediari' },
    ],
  },
  {
    label: 'Nav.Sicurezza',
    icon: 'bootstrapPersonLock',
    children: [
      { label: 'Nav.Operatori', icon: 'bootstrapPerson', route: '/operatori', acl: ['hasConfig'] },
      { label: 'Nav.Ruoli', icon: 'bootstrapPersonLock', route: '/ruoli', acl: ['hasRuoli'] },
    ],
  },
  {
    label: 'Nav.Impostazioni',
    icon: 'bootstrapGear',
    route: '/impostazioni',
    acl: ['hasSetting'],
    mobile: true,
  },
];

/**
 * Filtra l'albero di navigazione in base a feature flag (config tenant) e ACL utente.
 * Pure function, testabile.
 *
 * - Se una voce ha `feature` e il flag è `false`, viene rimossa (e con essa i figli).
 * - Se una voce ha `acl` e l'utente è loggato, almeno uno dei permessi deve essere `true`;
 *   se l'utente non è loggato (acl null), la voce resta visibile (la rotta è comunque protetta dal guard).
 * - Un nodo accordion senza route resta visibile solo se ha almeno un figlio visibile.
 */
export function filterNav(
  items: NavItem[],
  appConfig: AppConfig | null,
  acl: AuthAcl | null | undefined
): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    if (item.feature && appConfig?.Features?.[item.feature] === false) continue;
    if (item.acl && acl) {
      const allowed = item.acl.some((flag) => acl[flag] === true);
      if (!allowed) continue;
    }
    let children: NavItem[] | undefined = undefined;
    if (item.children?.length) {
      children = filterNav(item.children, appConfig, acl);
      if (children.length === 0 && !item.route) continue;
    }
    out.push(children ? { ...item, children } : item);
  }
  return out;
}

/**
 * Estrae le voci da mostrare nella mobile bottom-nav (max 4 + "Altro").
 * Cerca anche tra i figli per non perdere le voci principali nascoste sotto i gruppi.
 */
export function flattenMobile(items: NavItem[]): NavItem[] {
  const out: NavItem[] = [];
  const walk = (list: NavItem[]) => {
    for (const i of list) {
      if (i.mobile && i.route) out.push(i);
      if (i.children?.length) walk(i.children);
    }
  };
  walk(items);
  return out.slice(0, 4);
}

/**
 * Restituisce l'icona della voce di nav con la `label` data, cercando
 * anche tra i figli. Usato dal breadcrumb per auto-arricchire ogni item
 * con l'icona della rotta corrispondente, senza dover modificare le
 * singole `setBreadcrumbs([...])` di ogni feature.
 */
export function iconForNavLabel(label: string): string | undefined {
  const walk = (list: NavItem[]): NavItem | undefined => {
    for (const i of list) {
      if (i.label === label) return i;
      if (i.children?.length) {
        const found = walk(i.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return walk(NAV_ITEMS)?.icon;
}
