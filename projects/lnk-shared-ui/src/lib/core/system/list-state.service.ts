/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';

/**
 * Modalità di persistenza dello stato lista:
 * - `false` (default): solo in-memory — si perde al refresh della pagina.
 * - `true` | `'session'`: **sessionStorage** — sopravvive al refresh e al
 *   ritorno da un dettaglio, si svuota alla chiusura della tab.
 * - `'local'`: **localStorage** — sopravvive anche alla chiusura del browser.
 */
export type ListStatePersistence = boolean | 'session' | 'local';

/**
 * Stato delle pagine lista (filtri + ordinamento). Permette di ripristinarlo
 * quando l'utente torna indietro da un dettaglio (il servizio
 * `providedIn: 'root'` mantiene lo state per la sessione).
 *
 * Di base è **in-memory** (si svuota al refresh). Opzionalmente, per-chiave,
 * può essere reso **persistente** (session/local storage) passando il flag
 * `persist` a `set()` — tipicamente pilotato da un flag nel config di feature
 * (es. `persistState` in `pendenze-config.json`). La lettura (`get`) usa
 * comunque lo storage come fallback, così il ripristino dopo un refresh
 * funziona anche prima che il config sia caricato.
 *
 * Esempio:
 *   ```ts
 *   const saved = this.state.get<MyState>('pendenze');   // memory → storage
 *   this.state.set('pendenze', value, this.rowConfig()?.persistState ?? false);
 *   ```
 *
 * Note:
 *   - Serializzazione JSON: i valori devono essere serializzabili.
 *   - Niente chiave per tenant: lo state è scoped per browser.
 */
@Injectable({ providedIn: 'root' })
export class ListStateService {
  private static readonly PREFIX = 'lnk-list-state:';
  /** Chiave (byte) per l'offuscamento XOR del valore persistito. */
  private static readonly OBFUSCATION_KEY = new TextEncoder().encode('lnk-shared-ui/list-state');

  private readonly store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    if (this.store.has(key)) return this.store.get(key) as T;
    // Fallback: ripristina da storage (session prima, poi local).
    for (const storage of [this.storage('session'), this.storage('local')]) {
      const raw = storage?.getItem(ListStateService.PREFIX + key);
      if (raw != null) {
        try {
          const value = this.decode(raw) as T;
          this.store.set(key, value);
          return value;
        } catch {
          /* contenuto corrotto/illeggibile: ignora */
        }
      }
    }
    return undefined;
  }

  set<T>(key: string, value: T, persist: ListStatePersistence = false): void {
    this.store.set(key, value);
    const target = this.storageFor(persist);
    // In-memory only: non tocca lo storage. Importante NON rimuovere qui, così
    // un `set` con flag ancora non risolto (config di feature caricato in
    // async) non cancella uno stato già persistito. La rimozione avviene solo
    // in `clear()`.
    if (!target) return;
    const skey = ListStateService.PREFIX + key;
    try {
      target.setItem(skey, this.encode(value));
    } catch {
      /* quota / storage non disponibile: ignora */
    }
    // Evita copie duplicate nell'altro storage (es. switch session↔local).
    const other = target === this.storage('local') ? this.storage('session') : this.storage('local');
    try {
      other?.removeItem(skey);
    } catch {
      /* ignora */
    }
  }

  clear(key?: string): void {
    if (key) {
      this.store.delete(key);
      this.removeFromStorage(key);
    } else {
      for (const k of this.store.keys()) this.removeFromStorage(k);
      this.store.clear();
    }
  }

  /** Storage di destinazione per la modalità richiesta (o `null` se in-memory). */
  private storageFor(persist: ListStatePersistence): Storage | null {
    if (persist === 'local') return this.storage('local');
    if (persist === true || persist === 'session') return this.storage('session');
    return null;
  }

  /** Accesso sicuro allo storage (guardia SSR/prerender e ambienti bloccati). */
  private storage(kind: 'session' | 'local'): Storage | null {
    try {
      if (typeof window === 'undefined') return null;
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  /**
   * Offusca il valore prima di scriverlo in storage: JSON → XOR con una chiave
   * statica → base64. **Non è cifratura sicura** (la chiave è nel bundle), ma
   * evita che filtri/PII (es. identificativo debitore) siano leggibili in
   * chiaro in devtools/storage.
   */
  private encode(value: unknown): string {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const k = ListStateService.OBFUSCATION_KEY;
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= k[i % k.length];
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }

  private decode(raw: string): unknown {
    const bin = atob(raw);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const k = ListStateService.OBFUSCATION_KEY;
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= k[i % k.length];
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  private removeFromStorage(key: string): void {
    const skey = ListStateService.PREFIX + key;
    for (const kind of ['session', 'local'] as const) {
      try {
        this.storage(kind)?.removeItem(skey);
      } catch {
        /* ignora */
      }
    }
  }
}
