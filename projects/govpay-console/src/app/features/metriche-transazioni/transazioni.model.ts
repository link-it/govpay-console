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

// Modello dell'andamento storico delle transazioni pagoPA. Endpoint reale non
// ancora definito: forma provvisoria alimentata da un mock (vedi il service).

/** Conteggi transazioni di un singolo giorno. */
export interface TransazioniGiorno {
  /** Data del giorno (ISO `YYYY-MM-DD`). */
  data: string;
  /** Transazioni concluse con pagamento. */
  pagate: number;
  /** Transazioni fallite. */
  fallite: number;
}

/** Serie storica delle transazioni su un periodo. */
export interface AndamentoTransazioni {
  da: string;
  a: string;
  giorni: TransazioniGiorno[];
}
