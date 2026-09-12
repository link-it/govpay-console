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

import { computed, inject, signal, type Signal } from '@angular/core';
import { ConfigService } from '@linkit/shared-ui';
import { PreferencesService } from './preferences.service';

/** Tipo di vista di una lista. */
export type ListViewMode = 'table' | 'rows';

/** Gestore della vista di una feature: sessione + preferenza + default config. */
export interface FeatureView {
  /** Vista effettiva: override di sessione ?? preferenza utente ?? default config. */
  readonly mode: Signal<ListViewMode>;
  /** Imposta la vista (override immediato + persistenza nelle preferenze). */
  set(value: ListViewMode | string): void;
  /** Ripristina il default (rimuove override di sessione e preferenza). */
  reset(): void;
}

/**
 * Incapsula la logica della vista lista, condivisa da tutti i componenti list.
 * Da chiamare in un **injection context** (field initializer del componente):
 *
 * ```ts
 * private readonly view = createFeatureView('ricevute');
 * readonly viewMode = this.view.mode;
 * onViewModeChange(v: string) { this.view.set(v); }
 * ```
 */
export function createFeatureView(feature: string): FeatureView {
  const config = inject(ConfigService);
  const prefs = inject(PreferencesService);
  const override = signal<ListViewMode | null>(null);

  const configDefault = computed<ListViewMode>(() => {
    const layout = config.appConfig()?.Layout;
    return layout?.listViewByFeature?.[feature] ?? layout?.listView ?? 'table';
  });

  const mode = computed<ListViewMode>(
    () => override() ?? prefs.featureView(feature) ?? configDefault(),
  );

  return {
    mode,
    set: (value) => {
      const v: ListViewMode = value === 'rows' ? 'rows' : 'table';
      override.set(v);
      prefs.setFeatureView(feature, v);
    },
    reset: () => {
      override.set(null);
      prefs.setFeatureView(feature, null);
    },
  };
}

/** Feature con vista lista commutabile, per la UI di gestione delle preferenze. */
export const LIST_VIEW_FEATURES: { key: string; labelKey: string }[] = [
  { key: 'pendenze', labelKey: 'Nav.Pendenze' },
  { key: 'ricevute', labelKey: 'Nav.Ricevute' },
  { key: 'pagamenti', labelKey: 'Nav.Pagamenti' },
  { key: 'riscossioni', labelKey: 'Nav.Riscossioni' },
  { key: 'rendicontazioni', labelKey: 'Nav.Rendicontazioni' },
  { key: 'incassi', labelKey: 'Nav.Incassi' },
  { key: 'giornale-eventi', labelKey: 'Nav.GiornaleEventi' },
  { key: 'tracciati', labelKey: 'Nav.Tracciati' },
  { key: 'domini', labelKey: 'Nav.Domini' },
  { key: 'tipi-pendenza', labelKey: 'Nav.TipiPendenza' },
  { key: 'entrate', labelKey: 'Nav.Entrate' },
  { key: 'applicazioni', labelKey: 'Nav.Applicazioni' },
  { key: 'intermediari', labelKey: 'Nav.Intermediari' },
  { key: 'operatori', labelKey: 'Nav.Operatori' },
  { key: 'ruoli', labelKey: 'Nav.Ruoli' },
];
