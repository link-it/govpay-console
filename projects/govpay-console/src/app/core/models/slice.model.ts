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
 * Modelli di paginazione della **GovPay Console API V2** (schema OpenAPI
 * `PaginatedResponse` / `Pagination`).
 *
 * Differiscono dal `Pageable<T>` V1 (`pageable.model.ts`, campi italiani
 * `numRisultati`/`numPagine`/…): la V2 usa nomi inglesi e due modalità di
 * paginazione mutuamente esclusive.
 */

/**
 * Metadati di paginazione **offset** (modalità di default `?page=&limit=`).
 *
 * `hasNextPage` è **sempre** presente e alimenta l'infinite scroll senza
 * bisogno del conteggio totale. `totalResults`/`totalPages` compaiono solo
 * quando la richiesta è fatta con `?total=true` (comporta una COUNT extra).
 */
export interface Pagination {
  /** Pagina corrente (1-based). */
  page: number;
  /** Numero massimo di risultati per pagina (max 200). */
  limit: number;
  /** `true` se esiste almeno un risultato oltre la pagina corrente. */
  hasNextPage: boolean;
  /** Totale risultati. Presente solo con `?total=true`. */
  totalResults?: number;
  /** Totale pagine. Presente solo con `?total=true`. */
  totalPages?: number;
}

/**
 * Risposta paginata generica della console-api.
 *
 * - **offset** (default): `pagination` valorizzato, `nextCursor` assente.
 * - **cursor** (opt-in `?cursor=`): `nextCursor` valorizzato, `pagination`
 *   assente; ordinamento fisso `dataUltimoAggiornamento DESC, id DESC`.
 */
export interface Slice<T> {
  results: T[];
  pagination?: Pagination;
  /** Cursore opaco (base64) da rispedire come `?cursor=` per la pagina dopo. */
  nextCursor?: string;
}

/**
 * `true` se ci sono altri risultati oltre quelli già ricevuti, in entrambe
 * le modalità (offset → `pagination.hasNextPage`; cursor → presenza di
 * `nextCursor`). Helper per l'infinite scroll.
 */
export function sliceHasMore<T>(slice: Slice<T> | null | undefined): boolean {
  if (!slice) return false;
  if (slice.nextCursor) return true;
  return slice.pagination?.hasNextPage ?? false;
}

/**
 * Parametri di paginazione comuni a tutte le liste console-api V2.
 * I filtri specifici di risorsa estendono questa base.
 */
export interface PaginationParams {
  /** Pagina 1-based (modalità offset). Mutuamente esclusivo con `cursor`. */
  page?: number;
  /** Risultati per pagina (default 25, max 200). */
  limit?: number;
  /** Ordinamento (es. `-dataUltimoAggiornamento`). Non ammesso con `cursor`. */
  sort?: string;
  /** Se `true` include `totalResults`/`totalPages`. Non ammesso con `cursor`. */
  total?: boolean;
  /** Cursore opaco. Mutuamente esclusivo con `page`/`sort`/`total`. */
  cursor?: string;
}
