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

import { Routes } from '@angular/router';

export const RENDICONTAZIONI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rendicontazioni-list.component').then((m) => m.RendicontazioniListComponent),
  },
  {
    // Path canonico GovPay: idDominio + idFlusso + dataFlusso (ISO 8601).
    // Il dataFlusso include `:` e `+` che vanno encoded dalla list quando
    // si naviga, ma non più ri-encoded dall'API service.
    path: ':idDominio/:idFlusso/:dataFlusso',
    loadComponent: () =>
      import('./rendicontazione-detail.component').then((m) => m.RendicontazioneDetailComponent),
  },
];
