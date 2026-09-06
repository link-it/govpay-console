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

export const OPERAZIONI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./operazioni-list.component').then((m) => m.OperazioniListComponent),
  },
  {
    path: ':idOperazione',
    loadComponent: () =>
      import('./operazione-detail.component').then((m) => m.OperazioneDetailComponent),
  },
  {
    path: ':idOperazione/esecuzioni/:idEsecuzione',
    loadComponent: () =>
      import('./esecuzione-detail.component').then((m) => m.EsecuzioneDetailComponent),
  },
];
