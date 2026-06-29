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
import type { TweakRow, TweakSectionDef } from './tweaks-types';

// Re-export per backward-compat: i tipi erano definiti qui prima
// dell'estrazione in `tweaks-types`.
export type { TweakRow, TweakSectionDef };

/**
 * Registry singleton per le sezioni del `<lnk-tweaks-panel>` globale.
 *
 * Pattern d'uso (in costruttore di un component):
 *
 *   ```ts
 *   constructor() {
 *     const tweaks = inject(TweaksRegistry);
 *     inject(DestroyRef).onDestroy(
 *       tweaks.register({
 *         id: 'pendenze',
 *         titleKey: 'Tweaks.Layout',
 *         rows: [
 *           { type: 'segmented', labelKey: 'Tweaks.View',
 *             options: VIEW_OPTIONS, value: this.viewMode,
 *             onChange: v => this.onViewModeChange(v) },
 *         ],
 *         onReset: () => this.viewModeOverride.set(null),
 *       })
 *     );
 *   }
 *   ```
 *
 * `register()` restituisce direttamente la cleanup function da passare a
 * `DestroyRef.onDestroy()` — il contratto è esplicito e non lascia spazio
 * a leak per dimenticanza. Stessa `id` → sostituzione (last-write-wins).
 *
 * Lo stato di apertura del pannello (`open`) è centralizzato qui e
 * controllato da chiunque (FAB, scorciatoie, programmaticamente).
 */
@Injectable({ providedIn: 'root' })
export class TweaksRegistry {
  /** Mappa id → section definition. Nessun ordinamento implicito. */
  private readonly _sections = signal<Map<string, TweakSectionDef>>(new Map());
  /** Stato apertura del pannello. */
  readonly open = signal(false);

  /**
   * Sezioni ordinate per priorità decrescente (default 0), poi per
   * insertion order (Map iteration order è insertion order in JS).
   */
  readonly sections = computed<TweakSectionDef[]>(() => {
    const list = [...this._sections().values()];
    return list.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  });

  /** Numero di sezioni registrate (0 → solo sezione globale visibile). */
  readonly count = computed(() => this._sections().size);

  /**
   * Registra una sezione. La cleanup function rimuove la sezione dalla
   * registry e va passata a `DestroyRef.onDestroy()`.
   */
  register(def: TweakSectionDef): () => void {
    this._sections.update((m) => {
      const next = new Map(m);
      next.set(def.id, def);
      return next;
    });
    return () => this.unregister(def.id);
  }

  /** Rimuove la sezione con `id`. */
  unregister(id: string): void {
    this._sections.update((m) => {
      if (!m.has(id)) return m;
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }

  /** Apre/chiude/toggle programmatico del pannello. */
  setOpen(value: boolean): void {
    this.open.set(value);
  }
  toggle(): void {
    this.open.update((v) => !v);
  }

  /**
   * Invoca `onReset()` di ogni sezione registrata. Usato dal pulsante
   * "Reset" del footer del pannello globale (in aggiunta al reset degli
   * override `Layout` gestiti da `LayoutOverridesService`).
   */
  resetAll(): void {
    for (const def of this._sections().values()) {
      def.onReset?.();
    }
  }
}
