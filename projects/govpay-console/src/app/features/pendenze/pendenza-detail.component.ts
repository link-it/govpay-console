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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@linkit/shared-ui';
import { SnackbarService } from '@linkit/shared-ui';
import {
  ConfirmDialogComponent,
  DataTableComponent,
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  downloadBlob,
  formatDate,
  formatEuro,
  truncate,
  type ColumnDef,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { PendenzeConsoleApi } from './pendenze.console-api';
import {
  STATO_PENDENZA_COLOR,
  STATO_PENDENZA_LABEL,
  STATO_VOCE_PENDENZA_COLOR,
  STATO_VOCE_PENDENZA_LABEL,
  type Pendenza,
  type RicevutaSummary,
  type Soggetto,
  type VocePendenza,
} from './pendenza.model';

@Component({
  selector: 'lnk-pendenza-detail',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    InfoGridComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    DataTableComponent,
    ListStickyToolbarDirective,
    ConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pendenza-detail.component.html',
})
export class PendenzaDetailComponent implements OnInit {
  private readonly api = inject(PendenzeConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly pendenza = signal<Pendenza | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private idA2A = '';
  private idPendenza = '';

  /* ---- Soggetto pagatore: on-demand con consenso GDPR ---------------- */
  readonly debitore = signal<Soggetto | null>(null);
  readonly debitoreLoading = signal(false);
  readonly askConsenso = signal(false);
  /** Il link è sempre presente in V2, ma gatiamo comunque sull'`_links`. */
  readonly hasDebitoreLink = computed(() => !!this.pendenza()?._links?.informazioniDebitore);

  /* ---- Avviso: azione PDF gated da `_links.avviso` ------------------- */
  readonly hasAvvisoLink = computed(() => !!this.pendenza()?._links?.avviso);
  readonly avvisoLoading = signal(false);

  /* ---- Ricevute: elenco metadata-only ------------------------------- */
  readonly ricevute = signal<RicevutaSummary[] | null>(null);

  readonly title = computed(() => {
    const p = this.pendenza();
    return p?.numeroAvviso || p?.idPendenza || '—';
  });

  readonly statoTone = computed(() => {
    const s = this.pendenza()?.stato;
    return s ? STATO_PENDENZA_COLOR[s] : 'muted';
  });

  readonly statoLabelKey = computed(() => {
    const s = this.pendenza()?.stato;
    return s ? STATO_PENDENZA_LABEL[s] : 'Pendenze.Stati.NonPagata';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Pendenze.Detail.NumeroAvviso', value: p.numeroAvviso, mono: true, hide: !p.numeroAvviso },
      { labelKey: 'Pendenze.Detail.IuvAvviso', value: p.iuvAvviso, mono: true, hide: !p.iuvAvviso },
      { labelKey: 'Pendenze.Detail.IdPendenza', value: p.idPendenza, mono: true },
      { labelKey: 'Pendenze.Detail.IdA2A', value: p.idA2A, mono: true },
      { labelKey: 'Pendenze.Detail.Tipo', value: p.tipoPendenza?.descrizione },
      { labelKey: 'Pendenze.Detail.Importo', value: formatEuro(p.importo) },
      { labelKey: 'Pendenze.Detail.DataValidita', value: formatDate(p.dataValidita), hide: !p.dataValidita },
      { labelKey: 'Pendenze.Detail.DataScadenza', value: formatDate(p.dataScadenza), hide: !p.dataScadenza },
      { labelKey: 'Pendenze.Detail.DataAggiornamento', value: formatDate(p.dataUltimoAggiornamento), hide: !p.dataUltimoAggiornamento },
      { labelKey: 'Pendenze.Detail.Descrizione', value: p.descrizione, wide: true, hide: !p.descrizione },
      { labelKey: 'Pendenze.Detail.Causale', value: p.causale, wide: true },
    ];
  });

  readonly dominioItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Pendenze.Detail.IdDominio', value: p.dominio?.idDominio, mono: true },
      { labelKey: 'Pendenze.Detail.RagioneSociale', value: p.dominio?.ragioneSociale, hide: !p.dominio?.ragioneSociale },
      { labelKey: 'Pendenze.Detail.UnitaOperativa', value: p.unitaOperativa?.ragioneSociale, hide: !p.unitaOperativa },
    ];
  });

  readonly debitoreItems = computed<InfoGridItem[]>(() => {
    const s = this.debitore();
    if (!s) return [];
    return [
      { labelKey: 'Pendenze.Detail.Anagrafica', value: s.anagrafica, wide: true },
      { labelKey: 'Pendenze.Detail.Identificativo', value: s.identificativo, mono: true },
      {
        labelKey: 'Pendenze.Detail.TipoSoggetto',
        value: s.tipo === 'F' ? 'Persona fisica' : s.tipo === 'G' ? 'Persona giuridica' : '',
        hide: !s.tipo,
      },
      { labelKey: 'Pendenze.Detail.Indirizzo', value: [s.indirizzo, s.civico].filter(Boolean).join(', '), wide: true, hide: !s.indirizzo },
      { labelKey: 'Pendenze.Detail.Localita', value: [s.cap, s.localita, s.provincia].filter(Boolean).join(' '), hide: !s.localita },
      { labelKey: 'Pendenze.Detail.Nazione', value: s.nazione, hide: !s.nazione },
      { labelKey: 'Pendenze.Detail.Email', value: s.email, hide: !s.email },
      { labelKey: 'Pendenze.Detail.Cellulare', value: s.cellulare, hide: !s.cellulare },
    ];
  });

  readonly vociColumns = computed<ColumnDef<VocePendenza>[]>(() => [
    {
      key: 'indice',
      header: 'Pendenze.Voci.Indice',
      format: (v) => (v.indice != null ? String(v.indice) : '—'),
      cellClass: 'font-mono text-xs',
      width: '4rem',
    },
    {
      key: 'descrizione',
      header: 'Pendenze.Voci.Descrizione',
      format: (v) => truncate(v.descrizione, 80),
    },
    {
      key: 'importo',
      header: 'Pendenze.Voci.Importo',
      format: (v) => formatEuro(v.importo),
      align: 'right',
      cellClass: 'font-mono',
      width: '8rem',
    },
    {
      key: 'stato',
      header: 'Pendenze.Voci.Stato',
      cellType: 'badge',
      cellTone: (v) => STATO_VOCE_PENDENZA_COLOR[v.stato] ?? 'muted',
      format: (v) => STATO_VOCE_PENDENZA_LABEL[v.stato] ?? v.stato,
      width: '9rem',
    },
  ]);

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idA2A = params.get('idA2A');
    const idPendenza = params.get('idPendenza');
    if (!idA2A || !idPendenza) {
      this.router.navigate(['/pendenze']);
      return;
    }
    this.idA2A = idA2A;
    this.idPendenza = idPendenza;
    this.system.setBreadcrumbs([
      { label: 'Nav.Pendenze', url: '/pendenze' },
      { label: idPendenza },
    ]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idA2A, this.idPendenza)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((p) => {
        this.pendenza.set(p);
        this.loading.set(false);
        if (p) this.fetchRicevute();
      });
  }

  /** Elenco (metadata-only) delle ricevute; errore non bloccante. */
  private fetchRicevute(): void {
    this.api
      .listRicevute(this.idA2A, this.idPendenza)
      .pipe(catchError(() => of<RicevutaSummary[]>([])))
      .subscribe((r) => this.ricevute.set(r));
  }

  formatData(value: string | undefined): string {
    return formatDate(value);
  }

  formatImporto(value: number | undefined): string {
    return value != null ? formatEuro(value) : '—';
  }

  /* ---- Consenso GDPR + fetch debitore -------------------------------- */
  onMostraDebitore(): void {
    if (this.debitore()) return; // già caricato
    this.askConsenso.set(true);
  }

  onConsensoAnnullato(): void {
    this.askConsenso.set(false);
  }

  onConsensoConfermato(): void {
    this.askConsenso.set(false);
    this.debitoreLoading.set(true);
    this.api
      .getInformazioniDebitore(this.idA2A, this.idPendenza)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of(null);
        })
      )
      .subscribe((s) => {
        this.debitore.set(s);
        this.debitoreLoading.set(false);
      });
  }

  /* ---- Stampa avviso PDF --------------------------------------------- */
  onStampaAvviso(): void {
    if (this.avvisoLoading()) return;
    this.avvisoLoading.set(true);
    this.api
      .getAvvisoPdf(this.idA2A, this.idPendenza)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Pendenze.Detail.AvvisoErrore')));
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.avvisoLoading.set(false);
        if (!blob) return;
        const p = this.pendenza();
        const name = `avviso-${p?.numeroAvviso || p?.idPendenza || 'pendenza'}.pdf`;
        downloadBlob(blob, name);
      });
  }
}
