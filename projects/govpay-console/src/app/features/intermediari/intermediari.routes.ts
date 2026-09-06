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

export const INTERMEDIARI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./intermediari-list.component').then((m) => m.IntermediariListComponent),
  },
  {
    // `nuovo` prima di `:idIntermediario` per non essere catturato dal wildcard param.
    path: 'nuovo',
    loadComponent: () =>
      import('./intermediario-form.component').then((m) => m.IntermediarioFormComponent),
  },
  {
    path: ':idIntermediario',
    loadComponent: () =>
      import('./intermediario-detail.component').then((m) => m.IntermediarioDetailComponent),
  },
  {
    path: ':idIntermediario/modifica',
    loadComponent: () =>
      import('./intermediario-form.component').then((m) => m.IntermediarioFormComponent),
  },
  // Stazioni e connettori si modificano inline nel dettaglio (nessuna rotta dedicata).
];
