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
 * Converte una data `YYYY-MM-DD` nell'istante **ISO 8601 completo** (RFC 3339)
 * di inizio (`00:00:00`) o fine (`23:59:59`) giornata in ora locale,
 * serializzato in UTC (`…Z`, senza millisecondi).
 *
 * Necessario per le liste Console API V2 i cui filtri data sono
 * `format: date-time` (es. `/eventi`, `/flussi-rendicontazione`): il formato
 * troncato `YYYY-MM-DDTHH:MM` delle liste V1 verrebbe rifiutato con 400.
 *
 * Ritorna `undefined` se la data è vuota o malformata.
 */
export function dayToIso(date: string | undefined | null, endOfDay: boolean): string | undefined {
  if (!date) return undefined;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  const dt = endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 0)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  // Rimuovi i millisecondi: `2026-08-23T22:00:00Z` (parser BE più stretti).
  return dt.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
