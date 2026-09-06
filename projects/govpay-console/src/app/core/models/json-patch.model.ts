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
 * Tipi per **JSON Patch (RFC 6902)** — usati dagli update parziali dell'area
 * Impostazioni della Console API V2 (content-type `application/json-patch+json`).
 *
 * Corrisponde agli schemi `JsonPatch` / `JsonPatchOperation` dell'OpenAPI
 * (`openapi-20260825.yaml`). Altrove nel V2 si usa PUT-replace (vedi
 * `ConsoleApiService.put`); il PATCH è riservato ai singleton di configurazione,
 * dove l'update parziale evita di azzerare campi non gestiti dalla UI.
 */

/** Tipo di operazione JSON Patch (RFC 6902). */
export type JsonPatchOpType = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

/**
 * Singola operazione JSON Patch (RFC 6902).
 * - `value` è richiesto per `add`/`replace`/`test`.
 * - `from` (JSON Pointer sorgente) è richiesto per `move`/`copy`.
 */
export interface JsonPatchOp {
  op: JsonPatchOpType;
  /** JSON Pointer (RFC 6901) del campo destinazione. */
  path: string;
  /** Valore dell'operazione (per `add`, `replace`, `test`). */
  value?: unknown;
  /** JSON Pointer sorgente (per `move`, `copy`). */
  from?: string;
}

/** Documento JSON Patch: sequenza ordinata di operazioni. */
export type JsonPatch = JsonPatchOp[];
