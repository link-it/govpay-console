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
import { MainLayoutComponent } from '@core/layout';
import { aclGuard, authGuard, maintenanceGuard } from '@core/auth';

const placeholder = () =>
  import('@core/ui/placeholder/placeholder.component').then((m) => m.PlaceholderComponent);

export const routes: Routes = [
  {
    path: 'maintenance',
    loadComponent: () =>
      import('@core/layout/maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [maintenanceGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('@feature/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      // Feature implementate
      {
        path: 'pendenze',
        canActivate: [aclGuard('hasPendenze', 'hasPagamentiePendenze')],
        loadChildren: () => import('@feature/pendenze').then((m) => m.PENDENZE_ROUTES),
      },
      {
        path: 'ricevute',
        canActivate: [authGuard],
        loadChildren: () => import('@feature/ricevute').then((m) => m.RICEVUTE_ROUTES),
      },
      {
        path: 'pagamenti',
        canActivate: [aclGuard('hasPagamenti', 'hasPagamentiePendenze')],
        loadChildren: () => import('@feature/pagamenti').then((m) => m.PAGAMENTI_ROUTES),
      },
      {
        path: 'riscossioni',
        canActivate: [aclGuard('hasRendiIncassi')],
        loadChildren: () => import('@feature/riscossioni').then((m) => m.RISCOSSIONI_ROUTES),
      },
      {
        path: 'rendicontazioni',
        canActivate: [aclGuard('hasRendiIncassi')],
        loadChildren: () => import('@feature/rendicontazioni').then((m) => m.RENDICONTAZIONI_ROUTES),
      },
      {
        path: 'incassi',
        canActivate: [aclGuard('hasRendiIncassi')],
        loadChildren: () => import('@feature/incassi').then((m) => m.INCASSI_ROUTES),
      },
      {
        path: 'giornale-eventi',
        canActivate: [aclGuard('hasGdE')],
        loadChildren: () => import('@feature/giornale-eventi').then((m) => m.GIORNALE_EVENTI_ROUTES),
      },
      {
        path: 'tracciati',
        canActivate: [authGuard],
        loadChildren: () => import('@feature/tracciati').then((m) => m.TRACCIATI_ROUTES),
      },
      {
        path: 'domini',
        canActivate: [aclGuard('hasConfig')],
        loadChildren: () => import('@feature/domini').then((m) => m.DOMINI_ROUTES),
      },
      {
        path: 'tipi-pendenza',
        canActivate: [aclGuard('hasConfig')],
        loadChildren: () => import('@feature/tipi-pendenza').then((m) => m.TIPI_PENDENZA_ROUTES),
      },
      // Sezioni placeholder (label è chiave i18n, vedi `placeholder.component.ts`)
      {
        path: 'applicazioni',
        canActivate: [aclGuard('hasApplicazioni')],
        loadChildren: () => import('@feature/applicazioni').then((m) => m.APPLICAZIONI_ROUTES),
      },
      {
        path: 'operatori',
        canActivate: [aclGuard('hasConfig')],
        loadChildren: () => import('@feature/operatori').then((m) => m.OPERATORI_ROUTES),
      },
      {
        path: 'ruoli',
        canActivate: [aclGuard('hasRuoli')],
        loadChildren: () => import('@feature/ruoli').then((m) => m.RUOLI_ROUTES),
      },
      {
        path: 'registro-intermediari',
        canActivate: [authGuard],
        loadChildren: () => import('@feature/intermediari').then((m) => m.INTERMEDIARI_ROUTES),
      },
      {
        path: 'profilo',
        canActivate: [authGuard],
        loadChildren: () => import('@feature/profilo').then((m) => m.PROFILO_ROUTES),
      },
      {
        path: 'impostazioni',
        canActivate: [aclGuard('hasSetting')],
        loadChildren: () => import('@feature/impostazioni').then((m) => m.IMPOSTAZIONI_ROUTES),
      },
      {
        path: 'about',
        loadComponent: () => import('@core/version').then((m) => m.AboutComponent),
      },
    ],
  },
  {
    path: 'auth/login',
    loadComponent: () => import('@feature/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/logout',
    loadComponent: () => import('@feature/auth/logout/logout.component').then((m) => m.LogoutComponent),
  },
  { path: '**', redirectTo: '' },
];
