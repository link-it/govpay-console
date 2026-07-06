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

export const RICEVUTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ricevute-list.component').then((m) => m.RicevuteListComponent),
  },
  {
    // V2: la RT è identificata dalla tupla (idDominio, iuv, idRicevuta).
    path: ':idDominio/:iuv/:idRicevuta',
    loadComponent: () =>
      import('./ricevuta-detail.component').then((m) => m.RicevutaDetailComponent),
  },
];
