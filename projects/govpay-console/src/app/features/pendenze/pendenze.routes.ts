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
    // Drilldown annidato alla ricevuta collegata (da "Stampa ricevuta" su una
    // pendenza pagata): il detail ricevuta rileva il padre dal `router.url` e
    // imposta back + breadcrumb verso la pendenza.
    path: ':idA2A/:idPendenza/ricevute/:idDominio/:iuv/:idRicevuta',
    loadComponent: () =>
      import('../ricevute/ricevuta-detail.component').then((m) => m.RicevutaDetailComponent),
  },
];
