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

/**
 * Helper di rendering condivisi dai componenti driven-by-config
 * (`lnk-item-type`, `lnk-item-row`, `lnk-data-table` con `displayConfig`).
 *
 * Adattati dal pattern GovHub `core/ui/shared/display-options.utils.ts`.
 */

export interface DisplayStyle {
  background: string;
  border: string;
  color: string;
}

/**
 * Risolve i tre token di stile (background/border/color) per una entry
 * di `DisplayOption`. Se l'entry è null usa il fallback (es. `default`),
 * altrimenti torna ai colori neutri (denim Link.it).
 */
export function resolveDisplayStyle(entry: unknown, fallback?: unknown): DisplayStyle {
  const src = (entry || fallback) as { background?: string; border?: string; color?: string } | null;
  return {
    background: src?.background ?? '#213349',
    border: src?.border ?? '#213349',
    color: src?.color ?? '#ffffff',
  };
}

/**
 * Tronca un testo a `rows` righe e `maxchars` caratteri (split sui newline).
 */
export function truncateRows(text: string | null | undefined, rows = 2, maxchars = 160): string {
  if (!text) return '';
  let split: string[] = [];
  if (/\r\n|\r|\n/.test(text)) {
    split = text.split(/\r\n|\r|\n/);
    text = split.slice(0, Math.min(rows, split.length)).join('\n').trim();
  }
  if (text.length > maxchars || rows < split.length) {
    return text.substring(0, maxchars).trim() + '…';
  }
  return text;
}

/**
 * Legge una proprietà nested via `path` puntato (`a.b.c`) o array
 * (`['a','b','c']`). Ritorna `undefined` se la chiave non esiste.
 */
export function getObjectValue(obj: unknown, path: string | string[] | undefined): unknown {
  if (obj == null || !path) return undefined;
  const segments = Array.isArray(path) ? path : path.split('.');
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Risolve background/color per un boxStatus che può puntare a una entry
 * dinamica di `options` (es. `{ background: { field: 'stato', options: 'STATI' } }`).
 */
export function getBoxOptionStyle(
  data: unknown,
  boxOptions: { background?: unknown; color?: string } | null | undefined,
  configOptions: Record<string, { values: Record<string, { background?: string; color?: string }> }> | undefined,
): { background: string; color: string } {
  const bg = boxOptions?.background;
  if (bg && typeof bg === 'object' && 'field' in bg) {
    const dyn = bg as unknown as { field: string; options: string };
    const value = String(getObjectValue(data, dyn.field) ?? '');
    const entry = configOptions?.[dyn.options]?.values?.[value];
    const style = resolveDisplayStyle(entry);
    return { background: style.background, color: style.color };
  }
  return {
    background: typeof bg === 'string' ? bg : '',
    color: boxOptions?.color || '',
  };
}
