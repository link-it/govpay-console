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
    // CCP opzionale: GovPay accetta IUV-only quando il CCP non è disponibile.
    path: ':idDominio/:iuv/:ccp',
    loadComponent: () =>
      import('./ricevuta-detail.component').then((m) => m.RicevutaDetailComponent),
  },
  {
    path: ':idDominio/:iuv',
    loadComponent: () =>
      import('./ricevuta-detail.component').then((m) => m.RicevutaDetailComponent),
  },
  {
    // Drilldown su evento dal tab Eventi del dettaglio ricevuta.
    path: ':idDominio/:iuv/:ccp/eventi/:id',
    loadComponent: () =>
      import('../giornale-eventi/evento-detail.component').then((m) => m.EventoDetailComponent),
  },
  {
    path: ':idDominio/:iuv/eventi/:id',
    loadComponent: () =>
      import('../giornale-eventi/evento-detail.component').then((m) => m.EventoDetailComponent),
  },
];
