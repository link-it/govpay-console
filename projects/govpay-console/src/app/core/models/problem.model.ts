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

import { HttpErrorResponse } from '@angular/common/http';

/**
 * Errore strutturato della **GovPay Console API V2** in formato RFC 7807
 * (`application/problem+json`).
 *
 * Sostituisce il modello V1 `ApiError` (`{ categoria, codice, descrizione }`,
 * vedi `pageable.model.ts`), tuttora usato dalle feature ancora su V1.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface Problem {
  /** URI del tipo di problema. Default `about:blank`. */
  type?: string;
  /** Titolo breve, leggibile e stabile del tipo di problema. */
  title?: string;
  /** Codice di stato HTTP (100–599). Unico campo obbligatorio. */
  status: number;
  /** Spiegazione specifica dell'occorrenza del problema. */
  detail?: string;
  /** URI dell'istanza specifica del problema. */
  instance?: string;
  /** Errori di validazione per campo (estensione GovPay). */
  errors?: ProblemFieldError[];
}

export interface ProblemFieldError {
  field?: string;
  message?: string;
}

/**
 * Type guard: `true` se il valore ha la forma di un {@link Problem}
 * (oggetto con `status` numerico).
 */
export function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Problem).status === 'number'
  );
}

/**
 * Estrae un messaggio leggibile da un errore della console-api.
 *
 * Ordine di preferenza: `detail` → `title` → messaggio HTTP → `fallback`.
 * Se sono presenti `errors[]` di validazione, li accoda al messaggio base.
 *
 * @param err       errore catturato (tipicamente `HttpErrorResponse`).
 * @param fallback  messaggio da usare se non si ricava nulla dal problem.
 */
export function problemDetail(err: unknown, fallback = ''): string {
  const problem = extractProblem(err);
  if (!problem) {
    if (err instanceof HttpErrorResponse && err.message) return err.message;
    return fallback;
  }

  const base = problem.detail || problem.title || fallback;
  const fields = (problem.errors ?? [])
    .map((e) => [e.field, e.message].filter(Boolean).join(': '))
    .filter(Boolean);

  return fields.length ? [base, ...fields].filter(Boolean).join(' — ') : base;
}

/**
 * Ritorna il {@link Problem} contenuto in un `HttpErrorResponse` (nel campo
 * `error`), oppure `null` se l'errore non è un problem+json riconoscibile.
 */
export function extractProblem(err: unknown): Problem | null {
  if (err instanceof HttpErrorResponse) {
    return isProblem(err.error) ? err.error : null;
  }
  return isProblem(err) ? err : null;
}
