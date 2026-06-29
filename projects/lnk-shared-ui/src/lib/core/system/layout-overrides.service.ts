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

import { Injectable, computed, signal } from '@angular/core';
import type { ControlPosition } from '../config/app-config.model';

/**
 * Override session-level di chiavi `Layout` configurabili a runtime
 * tramite il pannello `<lnk-tweaks-panel>`.
 *
 * Per ogni chiave: `null` significa "nessun override → usa il valore
 * dichiarato in `app-config.json`". Un valore concreto (boolean / string /
 * `ControlPosition`) prevale sul config base.
 *
 * Il merge avviene in `ConfigService.effectiveLayout()`, computed che i
 * consumer (sidebar, header-bar, main-layout, …) consumano al posto di
 * `appConfig().Layout` dove questi flag sono rilevanti.
 *
 * Le modifiche **non** sono persistite (vivono nella sessione in
 * memoria). Per persistenza cross-tab/navigazione si potrebbe scrivere
 * su `localStorage` con un effect, fuori scope qui.
 */
@Injectable({ providedIn: 'root' })
export class LayoutOverridesService {
  readonly listMaxWidth = signal<string | null>(null);
  readonly detailMaxWidth = signal<string | null>(null);
  readonly helpButton = signal<boolean | null>(null);
  readonly gotoTopButton = signal<boolean | null>(null);
  readonly languageSelectorPosition = signal<ControlPosition | null>(null);
  readonly darkModeTogglePosition = signal<ControlPosition | null>(null);

  /** True se almeno un override è impostato (per badge/bottone reset). */
  readonly hasAnyOverride = computed(
    () =>
      this.listMaxWidth() !== null ||
      this.detailMaxWidth() !== null ||
      this.helpButton() !== null ||
      this.gotoTopButton() !== null ||
      this.languageSelectorPosition() !== null ||
      this.darkModeTogglePosition() !== null
  );

  /** Azzera tutti gli override (torna al config base). */
  reset(): void {
    this.listMaxWidth.set(null);
    this.detailMaxWidth.set(null);
    this.helpButton.set(null);
    this.gotoTopButton.set(null);
    this.languageSelectorPosition.set(null);
    this.darkModeTogglePosition.set(null);
  }
}
