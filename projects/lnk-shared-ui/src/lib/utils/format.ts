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
 * Formatter helper per la presentazione di valori comuni nelle liste.
 * Pure functions, indipendenti da Angular — facili da testare.
 */

const EURO_FORMAT = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INTEGER_FORMAT = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });

const DATE_FORMAT = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Importo in euro (es. `1234.5` → `'1.234,50 €'`). */
export function formatEuro(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '';
  return EURO_FORMAT.format(n);
}

/** Intero con separatore migliaia (es. `1234` → `'1.234'`). */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '';
  return INTEGER_FORMAT.format(n);
}

/**
 * Restituisce una data nel formato `YYYY-MM-DD` (compatibile con
 * `<lnk-date-input>`) calcolata sottraendo `n` giorni alla data
 * di riferimento (default: ora).
 *
 *   `daysAgoIso(7)`  → 7 giorni fa (ultima settimana)
 *   `daysAgoIso(1)`  → ieri (ultime 24 ore con precisione giornaliera)
 *   `daysAgoIso(0)`  → oggi
 *
 * Esposta come funzione pura per essere usata come default nei filtri
 * lista. La data è calcolata sull'ora locale del browser.
 */
export function daysAgoIso(n: number, ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Data ISO → `'30/04/2026'`. Stringa vuota o non valida → `''`. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return DATE_FORMAT.format(d);
}

/** Data + ora ISO → `'30/04/2026, 10:30'`. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return DATETIME_FORMAT.format(d);
}

/** Tronca una stringa lunga a `max` caratteri aggiungendo `…`. */
export function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return '';
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + '…';
}

/**
 * Durata in millisecondi → stringa leggibile (`'1h 23m 45s'`, `'12.3s'`,
 * `'234 ms'`). Pensato per la durata di un evento del Giornale.
 *
 * Soglie:
 *   - `< 1000` ms       → `'NNN ms'`
 *   - `< 60000` ms      → `'X.Ys'` (un decimale)
 *   - `< 3_600_000` ms  → `'Mm SSs'`
 *   - `>= 3_600_000` ms → `'Hh Mm SSs'`
 */
export function formatMsTime(ms: number | string | null | undefined): string {
  if (ms === null || ms === undefined || ms === '') return '';
  const n = typeof ms === 'string' ? Number(ms) : ms;
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1000) return `${Math.round(n)} ms`;
  if (n < 60_000) return `${(n / 1000).toFixed(1)}s`;
  const totalSec = Math.floor(n / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hr = Math.floor(totalMin / 60);
  const pad = (v: number): string => String(v).padStart(2, '0');
  return hr > 0 ? `${hr}h ${pad(min)}m ${pad(sec)}s` : `${min}m ${pad(sec)}s`;
}

/** Cache `Intl.RelativeTimeFormat` (uno per locale). */
const RTF_CACHE = new Map<string, Intl.RelativeTimeFormat>();
function rtf(locale: string): Intl.RelativeTimeFormat {
  let f = RTF_CACHE.get(locale);
  if (!f) {
    f = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    RTF_CACHE.set(locale, f);
  }
  return f;
}

/**
 * Data ISO (passata o futura) → tempo relativo localizzato (`'2 ore fa'`,
 * `'ieri'`, `'tra 5 minuti'`). Usa `Intl.RelativeTimeFormat`, nessuna
 * dipendenza esterna.
 *
 * Soglie usate:
 *   - < 60s  → `'second'`
 *   - < 60m  → `'minute'`
 *   - < 24h  → `'hour'`
 *   - < 30d  → `'day'`
 *   - < 12m  → `'month'`
 *   - else   → `'year'`
 */
export function formatTimeAgo(value: string | Date | null | undefined, locale = 'it-IT'): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return '';
  const diffSec = Math.round((ms - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const f = rtf(locale);
  if (abs < 60) return f.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return f.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return f.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  if (Math.abs(diffDay) < 30) return f.format(diffDay, 'day');
  const diffMon = Math.round(diffDay / 30);
  if (Math.abs(diffMon) < 12) return f.format(diffMon, 'month');
  const diffYr = Math.round(diffMon / 12);
  return f.format(diffYr, 'year');
}
