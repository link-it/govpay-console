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

export const PENDENZE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pendenze-list.component').then((m) => m.PendenzeListComponent),
  },
  {
    path: ':idA2A/:idPendenza',
    loadComponent: () =>
      import('./pendenza-detail.component').then((m) => m.PendenzaDetailComponent),
  },
  {
    // Drilldown su evento dal tab Eventi del dettaglio pendenza.
    // Il breadcrumb e il "Indietro" sono ricostruiti da
    // EventoDetailComponent usando i params del path.
    path: ':idA2A/:idPendenza/eventi/:id',
    loadComponent: () =>
      import('../giornale-eventi/evento-detail.component').then((m) => m.EventoDetailComponent),
  },
];
