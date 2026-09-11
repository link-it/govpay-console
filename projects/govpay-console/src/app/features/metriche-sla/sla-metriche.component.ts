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

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LoadingComponent, SnackbarService, daysAgoIso } from '@linkit/shared-ui';
import { GaugeChartComponent, TimeSeriesChartComponent } from '@core/charts/chart-echarts';
import type { GaugeSpec, TimeSeriesSpec } from '@core/charts/chart-model';
import { problemDetail } from '@core/models';
import { MetricheSlaConsoleApi } from './metriche-sla.console-api';
import { slaKpiToGauge, slaSerieToTimeSeries } from './sla.adapter';
import type { SlaKpiCodice, SlaStato } from './sla.model';

/** Tono cromatico del badge di stato per ciascuno stato SLA. */
const STATO_TONE: Record<SlaStato, 'success' | 'warning' | 'danger'> = {
  OK: 'success',
  WARNING: 'warning',
  KO: 'danger',
};

/** Ampiezza del periodo iniziale (giorni): `dataDa`/`dataA` sono obbligatori. */
const PERIODO_GIORNI = 30;

/** Granularità selezionabili per la serie storica (minuti + etichetta compatta). */
const GRANULARITA: { minuti: number; label: string }[] = [
  { minuti: 5, label: '5m' },
  { minuti: 60, label: '1h' },
  { minuti: 1440, label: '1g' },
];

/** Riga pronta al render: KPI + gauge spec + presentazione dello stato. */
interface SlaGaugeItem {
  codice: SlaKpiCodice;
  metodo: string;
  tone: 'success' | 'warning' | 'danger';
  statoKey: string;
  totale: number;
  spec: GaugeSpec;
}

/**
 * Pannello grafici delle metriche SLA (metodi PA pagoPA): i 4 gauge di
 * conformità aggregata (`GET /metriche/sla`) su un periodo modificabile da UI e,
 * al click su un gauge, la serie storica del metodo (`GET /metriche/sla/{codice}`)
 * a granularità selezionabile.
 */
@Component({
  selector: 'lnk-sla-metriche',
  standalone: true,
  imports: [FormsModule, NgIcon, TranslatePipe, LoadingComponent, GaugeChartComponent, TimeSeriesChartComponent],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sla-metriche.component.html',
})
export class SlaMetricheComponent implements OnInit {
  private readonly api = inject(MetricheSlaConsoleApi);
  private readonly translate = inject(TranslateService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  /* ── Periodo (obbligatorio, modificabile da UI) ──────────────────── */
  readonly dataDa = signal(daysAgoIso(PERIODO_GIORNI));
  readonly dataA = signal(daysAgoIso(0));

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly items = signal<SlaGaugeItem[]>([]);

  /* ── Drilldown serie storica ─────────────────────────────────────── */
  readonly granularita = GRANULARITA;
  readonly gran = signal(60);
  readonly selected = signal<SlaKpiCodice | null>(null);
  readonly serieLoading = signal(false);
  readonly serieError = signal(false);
  /** `true` quando la serie non ha alcun punto con conformità (nessun traffico). */
  readonly serieEmpty = signal(false);
  readonly serieSpec = signal<TimeSeriesSpec | null>(null);

  ngOnInit(): void {
    this.loadSla();
  }

  /** Applica il nuovo estremo `dataDa` e ricarica (guardando `dataDa ≤ dataA`). */
  onDataDa(value: string): void {
    if (!value || value === this.dataDa()) return;
    this.dataDa.set(value);
    this.refresh();
  }

  /** Applica il nuovo estremo `dataA` e ricarica. */
  onDataA(value: string): void {
    if (!value || value === this.dataA()) return;
    this.dataA.set(value);
    this.refresh();
  }

  /** Ricarica i gauge e, se un metodo è selezionato, la sua serie storica. */
  refresh(): void {
    this.loadSla();
    if (this.selected()) this.fetchSerie();
  }

  private loadSla(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getSla({ dataDa: this.dataDa(), dataA: this.dataA() })
      .pipe(
        catchError((err) => {
          this.error.set(true);
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) {
          this.items.set([]);
          return;
        }
        this.items.set(
          res.kpi.map((k) => ({
            codice: k.codice,
            metodo: k.metodo,
            tone: STATO_TONE[k.stato],
            statoKey: `Sla.Stato.${k.stato}`,
            totale: k.totale,
            spec: slaKpiToGauge(k),
          })),
        );
      });
  }

  /** Click su un gauge: mostra (o nasconde) la serie storica del metodo. */
  selectMetodo(codice: SlaKpiCodice): void {
    if (this.selected() === codice) {
      this.selected.set(null);
      this.serieSpec.set(null);
      this.serieError.set(false);
      this.serieEmpty.set(false);
      return;
    }
    this.selected.set(codice);
    this.fetchSerie();
  }

  /** Cambia la granularità della serie e ricarica (se un metodo è selezionato). */
  setGran(minuti: number): void {
    if (this.gran() === minuti) return;
    this.gran.set(minuti);
    if (this.selected()) this.fetchSerie();
  }

  private fetchSerie(): void {
    const codice = this.selected();
    if (!codice) return;
    this.serieLoading.set(true);
    this.serieError.set(false);
    this.serieEmpty.set(false);
    this.serieSpec.set(null);
    this.api
      .getSerieStorica(codice, { dataDa: this.dataDa(), dataA: this.dataA(), granularitaMinuti: this.gran() })
      .pipe(
        catchError((err) => {
          this.serieError.set(true);
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.serieLoading.set(false);
        if (!res) return;
        // Il grafico si mostra sempre (traccia comunque il `totale`); solo un
        // periodo senza alcun bucket è "vuoto".
        const punti = res.serieStorica ?? [];
        this.serieEmpty.set(punti.length === 0);
        this.serieSpec.set(
          punti.length
            ? slaSerieToTimeSeries(res, {
                conformita: this.translate.instant('Sla.SerieConformita'),
                totale: this.translate.instant('Sla.SerieTotale'),
              })
            : null,
        );
      });
  }
}
