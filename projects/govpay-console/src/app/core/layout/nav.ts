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
import type { AppConfig } from '@linkit/shared-ui';

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
  /**
   * Nome del flag in `AppConfig.Features` che ne determina la visibilità.
   *
   * È il meccanismo config-driven di visibilità: applicato **ricorsivamente**
   * da {@link filterNav} sia ai gruppi sia alle foglie, consente di
   * abilitare/disabilitare **anche il singolo menu** assegnandogli un flag
   * (nome-capability) e valorizzandolo in `AppConfig.Features` (mappa aperta).
   */
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
      { label: 'Nav.Pendenze', icon: 'bootstrapReceipt', route: '/pendenze', acl: ['hasPendenze', 'hasPagamentiePendenze'], feature: 'MENU_PENDENZE' },
      { label: 'Nav.Ricevute', icon: 'bootstrapFileEarmarkText', route: '/ricevute', acl: ['hasPagamenti', 'hasPagamentiePendenze'], feature: 'MENU_RICEVUTE' },
      { label: 'Nav.Pagamenti', icon: 'bootstrapCreditCard2Front', route: '/pagamenti', acl: ['hasPagamenti', 'hasPagamentiePendenze'], feature: 'MENU_PAGAMENTI' },
    ],
  },
  {
    label: 'Nav.Riconciliazioni',
    icon: 'bootstrapBank',
    feature: 'GESTIONE_RISCOSSIONI',
    children: [
      { label: 'Nav.Riscossioni', icon: 'bootstrapBank', route: '/riscossioni', acl: ['hasRendiIncassi'], feature: 'MENU_RISCOSSIONI' },
      { label: 'Nav.Rendicontazioni', icon: 'bootstrapList', route: '/rendicontazioni', acl: ['hasRendiIncassi'], feature: 'MENU_RENDICONTAZIONI' },
      { label: 'Nav.Incassi', icon: 'bootstrapArchive', route: '/incassi', acl: ['hasRendiIncassi'], feature: 'MENU_INCASSI' },
    ],
  },
  {
    label: 'Nav.Monitoraggio',
    icon: 'bootstrapClockHistory',
    feature: 'GESTIONE_MONITORAGGIO',
    children: [
      { label: 'Nav.GiornaleEventi', icon: 'bootstrapClockHistory', route: '/giornale-eventi', acl: ['hasGdE'], feature: 'MENU_GIORNALE_EVENTI' },
      { label: 'Nav.Tracciati', icon: 'bootstrapFolder', route: '/tracciati', feature: 'MENU_TRACCIATI' },
    ],
  },
  {
    label: 'Nav.Anagrafiche',
    icon: 'bootstrapCollection',
    feature: 'GESTIONE_ANAGRAFICHE',
    children: [
      { label: 'Nav.Intermediari', icon: 'bootstrapBank', route: '/intermediari', feature: 'MENU_INTERMEDIARI' },
      { label: 'Nav.Domini', icon: 'bootstrapBuilding', route: '/domini', acl: ['hasConfig'], feature: 'MENU_DOMINI' },
      { label: 'Nav.TipiPendenza', icon: 'bootstrapCollection', route: '/tipi-pendenza', acl: ['hasConfig'], feature: 'MENU_TIPI_PENDENZA' },
      { label: 'Nav.Applicazioni', icon: 'bootstrapShieldCheck', route: '/applicazioni', acl: ['hasApplicazioni'], feature: 'MENU_APPLICAZIONI' },
      { label: 'Nav.Entrate', icon: 'bootstrapArchive', route: '/entrate', acl: ['hasConfig'], feature: 'MENU_ENTRATE' },
    ],
  },
  {
    label: 'Nav.Sicurezza',
    icon: 'bootstrapPersonLock',
    feature: 'GESTIONE_SICUREZZA',
    children: [
      { label: 'Nav.Operatori', icon: 'bootstrapPerson', route: '/operatori', acl: ['hasConfig'], feature: 'MENU_OPERATORI' },
      { label: 'Nav.Ruoli', icon: 'bootstrapPersonLock', route: '/ruoli', acl: ['hasRuoli'], feature: 'MENU_RUOLI' },
    ],
  },
  {
    label: 'Nav.Impostazioni',
    icon: 'bootstrapGear',
    feature: 'MENU_IMPOSTAZIONI',
    route: '/impostazioni',
    acl: ['hasSetting'],
    mobile: true,
  },
];

/**
 * `true` se la voce va nascosta a prescindere dai figli: feature flag disattivo
 * (`AppConfig.Features`) o nessun permesso ACL concesso tra quelli richiesti.
 */
function isNavItemHidden(
  item: NavItem,
  appConfig: AppConfig | null,
  acl: AuthAcl | null | undefined
): boolean {
  if (item.feature && appConfig?.Features?.[item.feature] === false) return true;
  // La voce Impostazioni vive nel menu profilo per default: appare in sidebar
  // solo con `Layout.settingsMenuPosition === 'sidebar'`.
  if (item.route === '/impostazioni' && appConfig?.Layout?.settingsMenuPosition !== 'sidebar') return true;
  if (item.acl && acl) return !item.acl.some((flag) => acl[flag] === true);
  return false;
}

/**
 * Filtra l'albero di navigazione in base a feature flag (config tenant) e ACL utente.
 * Pure function, testabile.
 *
 * - Se una voce ha `feature` e il flag in `AppConfig.Features` è `false`, viene
 *   rimossa (e con essa i figli). Il check è applicato **ricorsivamente**, quindi
 *   vale sia per i gruppi sia per il **singolo menu** foglia che dichiara un `feature`.
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
    if (isNavItemHidden(item, appConfig, acl)) continue;
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
