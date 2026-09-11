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

import type { ColorScheme } from '@linkit/shared-ui';

/**
 * Preferenze applicative dell'operatore, persistite server-side in
 * `Profilo.preferenze` (JSON libero, non interpretato dal server). Lo **schema è
 * di proprietà del FE**: chiavi **top-level** per consentire patch JSON Patch
 * granulari (`add /preferenze/<chiave>`). Estendere con nuove chiavi al bisogno.
 */
export interface AppPreferences {
  /** Modalità colore scelta dall'utente (`light`/`dark`/`auto`). */
  colorScheme?: ColorScheme;
  /** Lingua della UI (codice, es. `it`/`en`). */
  locale?: string;
  /** Chiavi future libere. */
  [key: string]: unknown;
}
