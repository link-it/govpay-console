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

export const OPERATORI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./operatori-list.component').then((m) => m.OperatoriListComponent),
  },
  {
    // `nuovo` prima di `:principal` per non essere catturato dal wildcard param.
    path: 'nuovo',
    loadComponent: () => import('./operatore-form.component').then((m) => m.OperatoreFormComponent),
  },
  {
    path: ':principal',
    loadComponent: () => import('./operatore-detail.component').then((m) => m.OperatoreDetailComponent),
  },
  {
    path: ':principal/modifica',
    loadComponent: () => import('./operatore-form.component').then((m) => m.OperatoreFormComponent),
  },
];
