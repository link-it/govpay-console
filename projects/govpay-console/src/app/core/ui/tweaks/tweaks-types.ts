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

import type { Signal } from '@angular/core';

/**
 * Contratto pubblico del pannello tweaks: tipi consumati dai feature
 * components per registrare sezioni in `TweaksRegistry`.
 *
 * Estratti dal componente/service per disaccoppiare i consumer
 * dall'implementazione: i feature importano da qui (e dal barrel
 * `@core/ui`) senza dipendere dai singoli building block.
 */

/** Opzione del segmented control. `labelKey` è una chiave i18n. */
export interface TweakSegmentedOption {
  value: string;
  /** Chiave i18n della label. */
  labelKey: string;
  /** Icona ng-icon opzionale (registrata in `icons.config.ts`). */
  icon?: string;
}

/**
 * Riga di una sezione tweaks: discriminated union per type-safety.
 *
 * `value` è un signal di sola lettura per evitare che la registry
 * trattenga riferimenti scrivibili al component (e quindi tenga vivi i
 * suoi signal anche dopo l'unregister). Le modifiche risalgono al
 * consumer via `onChange`.
 */
export type TweakRow =
  | {
      type: 'segmented';
      labelKey: string;
      hintKey?: string;
      options: TweakSegmentedOption[];
      value: Signal<string>;
      onChange: (value: string) => void;
    }
  | {
      type: 'toggle';
      labelKey: string;
      hintKey?: string;
      value: Signal<boolean>;
      onChange: (value: boolean) => void;
    };

/**
 * Definizione di una sezione del pannello. I consumer la passano a
 * `TweaksRegistry.register()`; same-id replace per evitare flicker su
 * route transition.
 */
export interface TweakSectionDef {
  /** Identificatore univoco (tipicamente il nome della feature). */
  id: string;
  /** Chiave i18n del titolo della sezione. */
  titleKey: string;
  /** Descrizione opzionale sotto al titolo. */
  descriptionKey?: string;
  /** Righe della sezione. */
  rows: TweakRow[];
  /** Callback invocata dal pulsante "Reset" del footer del pannello. */
  onReset?: () => void;
  /**
   * Priorità di rendering (insertion order di default = `0`). Sezioni con
   * priorità più alta appaiono prima.
   */
  priority?: number;
}
