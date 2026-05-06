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

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiService } from '@core/services/api.service';
import { SystemFacade } from '@core/system';
import type { Pageable } from '@core/models';

interface KpiCard {
  titleKey: string;
  /** numero formattato; `null` finché loading. */
  value: number | null;
  loading: boolean;
  error: boolean;
  link: string[];
  queryParams?: Record<string, string>;
  hintKey: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

@Component({
  selector: 'lnk-dashboard',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly system = inject(SystemFacade);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly pendenzeAttive = signal<{ value: number | null; loading: boolean; error: boolean }>({ value: null, loading: true, error: false });
  private readonly riscossioniMese = signal<{ value: number | null; loading: boolean; error: boolean }>({ value: null, loading: true, error: false });
  private readonly tracciatiInLavorazione = signal<{ value: number | null; loading: boolean; error: boolean }>({ value: null, loading: true, error: false });

  readonly cards = computed<KpiCard[]>(() => {
    const ora = new Date();
    const primoDelMese = new Date(ora.getFullYear(), ora.getMonth(), 1).toISOString().slice(0, 10);
    const p = this.pendenzeAttive();
    const r = this.riscossioniMese();
    const t = this.tracciatiInLavorazione();
    return [
      {
        titleKey: 'Dashboard.Cards.PendenzeAttive',
        value: p.value,
        loading: p.loading,
        error: p.error,
        link: ['/pendenze'],
        hintKey: 'Dashboard.Cards.PendenzeAttiveHint',
        icon: 'bootstrapReceipt',
        tone: 'primary',
      },
      {
        titleKey: 'Dashboard.Cards.RiscossioniMese',
        value: r.value,
        loading: r.loading,
        error: r.error,
        link: ['/riscossioni'],
        queryParams: { dataDa: primoDelMese },
        hintKey: 'Dashboard.Cards.RiscossioniMeseHint',
        icon: 'bootstrapBank',
        tone: 'success',
      },
      {
        titleKey: 'Dashboard.Cards.TracciatiInLavorazione',
        value: t.value,
        loading: t.loading,
        error: t.error,
        link: ['/tracciati'],
        hintKey: 'Dashboard.Cards.TracciatiInLavorazioneHint',
        icon: 'bootstrapFolder',
        tone: 'info',
      },
    ];
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Dashboard' }]);
    this.loadKpi();
  }

  goTo(card: KpiCard): void {
    this.router.navigate(card.link, { queryParams: card.queryParams });
  }

  private loadKpi(): void {
    // Pendenze attive: stato NON_ESEGUITA, conteggio totale dalla pagina 1.
    this.api
      .list<unknown>('pendenze', { stato: 'NON_ESEGUITA', pagina: 1, risPerPagina: 1 })
      .pipe(catchError(() => of({ numRisultati: 0 } as Pageable<unknown>)))
      .subscribe((page) => this.pendenzeAttive.set({ value: page.numRisultati ?? 0, loading: false, error: false }));

    // Riscossioni del mese: filtro dataDa = primo del mese corrente.
    const primo = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    this.api
      .list<unknown>('riscossioni', { dataDa: primo, pagina: 1, risPerPagina: 1 })
      .pipe(catchError(() => of({ numRisultati: 0 } as Pageable<unknown>)))
      .subscribe((page) => this.riscossioniMese.set({ value: page.numRisultati ?? 0, loading: false, error: false }));

    // Tracciati in elaborazione.
    this.api
      .list<unknown>('tracciati', { statoTracciatoPendenza: 'IN_ELABORAZIONE', pagina: 1, risPerPagina: 1 })
      .pipe(catchError(() => of({ numRisultati: 0 } as Pageable<unknown>)))
      .subscribe((page) => this.tracciatiInLavorazione.set({ value: page.numRisultati ?? 0, loading: false, error: false }));
  }
}
