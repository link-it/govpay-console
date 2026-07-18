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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, type Observable } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DataTableComponent,
  DisplayConfigLoader,
  DetailSectionComponent,
  EmptyStateComponent,
  InfoGridComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  PageHeaderComponent,
  StatusBadgeComponent,
  downloadBlob,
  formatDate,
  formatDateTime,
  formatEuro,
  type ColumnDef,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { RicevuteConsoleApi } from './ricevute.console-api';
import { statoRtColor, statoRtLabel, type Ricevuta, type RicevutaFormato, type RtTransfer } from './ricevuta.model';

@Component({
  selector: 'lnk-ricevuta-detail',
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
    ListStickyToolbarDirective,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ricevuta-detail.component.html',
})
export class RicevutaDetailComponent implements OnInit {
  private readonly api = inject(RicevuteConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly displayConfigLoader = inject(DisplayConfigLoader);

  /**
   * Visibilità delle sezioni del dettaglio da `ricevute-config.json`
   * (`detail.sections`): `false` nasconde la sezione anche se i dati sono
   * presenti; chiave assente = visibile (comportamento di default).
   */
  private readonly sectionsCfg = toSignal(
    this.displayConfigLoader.load('assets/config/ricevute-config.json').pipe(
      map((cfg) => (cfg as { detail?: { sections?: Record<string, boolean> } }).detail?.sections ?? {}),
      catchError(() => of<Record<string, boolean>>({}))
    ),
    { initialValue: {} as Record<string, boolean> }
  );

  /** `true` se la sezione va mostrata (default) — `false` solo se disattivata in config. */
  showSection(key: string): boolean {
    return this.sectionsCfg()[key] !== false;
  }

  idDominio = '';
  iuv = '';
  idRicevuta = '';

  readonly ricevuta = signal<Ricevuta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Chiave del download in corso (es. `rt:pdf`), per disabilitare il bottone. */
  readonly downloading = signal<string | null>(null);

  readonly statoTone = computed(() => statoRtColor(this.ricevuta()?.stato ?? ''));
  readonly statoLabel = computed(() => statoRtLabel(this.ricevuta()?.stato ?? ''));
  /** Importo formattato, messo in evidenza in testata (accanto allo stato). */
  readonly importoFmt = computed(() => {
    const i = this.ricevuta()?.importo;
    return i != null ? formatEuro(i) : null;
  });
  /** La RPT può mancare (RT acquisita in standin): disabilita i relativi download. */
  readonly hasRpt = computed(() => this.ricevuta()?.rpt != null);
  readonly pendenza = computed(() => this.ricevuta()?.pendenza ?? null);

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.ricevuta();
    if (!r) return [];
    return [
      { labelKey: 'Ricevute.Detail.Iuv', value: r.iuv, mono: true },
      { labelKey: 'Ricevute.Detail.IdRicevuta', value: r.idRicevuta, mono: true },
      { labelKey: 'Ricevute.Detail.Dominio', value: r.idDominio, mono: true },
      { labelKey: 'Ricevute.Detail.DataPagamento', value: formatDateTime(r.dataPagamento) },
      { labelKey: 'Ricevute.Detail.Psp', value: r.codPsp, hide: !r.codPsp },
      { labelKey: 'Ricevute.Detail.Versione', value: r.versione, hide: !r.versione },
      { labelKey: 'Ricevute.Detail.DescrizioneStato', value: r.descrizioneStato, wide: true, hide: !r.descrizioneStato },
    ];
  });

  readonly pendenzaItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Ricevute.Detail.IdA2A', value: p.idA2A, mono: true },
      { labelKey: 'Ricevute.Detail.IdPendenza', value: p.idPendenza, mono: true },
      { labelKey: 'Ricevute.Detail.CausaleBreve', value: p.causaleBreve, wide: true, hide: !p.causaleBreve },
    ];
  });

  /** Esito pagamento (RT). */
  readonly esitoRtItems = computed<InfoGridItem[]>(() => {
    const rt = this.ricevuta()?.rt;
    if (!rt) return [];
    return [
      { labelKey: 'Ricevute.Detail.Esito', value: rt.outcome, hide: !rt.outcome },
      { labelKey: 'Ricevute.Detail.ImportoPagato', value: rt.paymentAmount != null ? formatEuro(rt.paymentAmount) : undefined, hide: rt.paymentAmount == null },
      { labelKey: 'Ricevute.Detail.Commissione', value: rt.fee != null ? formatEuro(rt.fee) : undefined, hide: rt.fee == null },
      { labelKey: 'Ricevute.Detail.MetodoPagamento', value: rt.paymentMethod, hide: !rt.paymentMethod },
      { labelKey: 'Ricevute.Detail.DataOraPagamento', value: rt.paymentDateTime ? formatDateTime(rt.paymentDateTime) : undefined, hide: !rt.paymentDateTime },
      { labelKey: 'Ricevute.Detail.DataApplicazione', value: rt.applicationDate ? formatDate(rt.applicationDate) : undefined, hide: !rt.applicationDate },
      { labelKey: 'Ricevute.Detail.DataTrasferimento', value: rt.transferDate ? formatDate(rt.transferDate) : undefined, hide: !rt.transferDate },
      { labelKey: 'Ricevute.Detail.ReceiptId', value: rt.receiptId, mono: true, hide: !rt.receiptId },
      { labelKey: 'Ricevute.Detail.NumeroAvviso', value: rt.noticeNumber, mono: true, hide: !rt.noticeNumber },
    ];
  });

  /** Versante / debitore (RT). */
  readonly versanteItems = computed<InfoGridItem[]>(() => {
    const d = this.ricevuta()?.rt?.debtor;
    if (!d) return [];
    const id = d.uniqueIdentifier;
    return [
      { labelKey: 'Ricevute.Detail.Anagrafica', value: d.fullName, hide: !d.fullName },
      { labelKey: 'Ricevute.Detail.TipoSoggetto', value: this.tipoSoggetto(id?.entityUniqueIdentifierType), hide: !id?.entityUniqueIdentifierType },
      { labelKey: 'Ricevute.Detail.Identificativo', value: id?.entityUniqueIdentifierValue, mono: true, hide: !id?.entityUniqueIdentifierValue },
      { labelKey: 'Ricevute.Detail.Email', value: d['e-mail'], hide: !d['e-mail'] },
    ];
  });

  /** Prestatore servizi di pagamento (RT). */
  readonly pspItems = computed<InfoGridItem[]>(() => {
    const rt = this.ricevuta()?.rt;
    if (!rt) return [];
    const canale = [rt.idChannel, rt.channelDescription].filter(Boolean).join(' — ');
    return [
      { labelKey: 'Ricevute.Detail.PspDenominazione', value: rt.PSPCompanyName, hide: !rt.PSPCompanyName },
      { labelKey: 'Ricevute.Detail.PspId', value: rt.idPSP, mono: true, hide: !rt.idPSP },
      { labelKey: 'Ricevute.Detail.PspFiscalCode', value: rt.pspFiscalCode, mono: true, hide: !rt.pspFiscalCode },
      { labelKey: 'Ricevute.Detail.Canale', value: canale || undefined, hide: !canale },
    ];
  });

  /** Ente creditore (RT). */
  readonly enteItems = computed<InfoGridItem[]>(() => {
    const rt = this.ricevuta()?.rt;
    if (!rt) return [];
    return [
      { labelKey: 'Ricevute.Detail.EnteDenominazione', value: rt.companyName, hide: !rt.companyName },
      { labelKey: 'Ricevute.Detail.EnteFiscalCode', value: rt.fiscalCode, mono: true, hide: !rt.fiscalCode },
      { labelKey: 'Ricevute.Detail.CreditorReferenceId', value: rt.creditorReferenceId, mono: true, hide: !rt.creditorReferenceId },
      { labelKey: 'Ricevute.Detail.Causale', value: rt.description, wide: true, hide: !rt.description },
    ];
  });

  /** Richiesta di pagamento (RPT), quando disponibile. */
  readonly rptItems = computed<InfoGridItem[]>(() => {
    const rpt = this.ricevuta()?.rpt;
    if (!rpt) return [];
    return [
      { labelKey: 'Ricevute.Detail.ImportoRichiesto', value: rpt.paymentAmount != null ? formatEuro(rpt.paymentAmount) : undefined, hide: rpt.paymentAmount == null },
      { labelKey: 'Ricevute.Detail.Scadenza', value: rpt.dueDate ? formatDate(rpt.dueDate) : undefined, hide: !rpt.dueDate },
      { labelKey: 'Ricevute.Detail.UltimoPagamento', value: this.siNo(rpt.lastPayment), hide: rpt.lastPayment == null },
      { labelKey: 'Ricevute.Detail.CreditorReferenceId', value: rpt.creditorReferenceId, mono: true, hide: !rpt.creditorReferenceId },
      { labelKey: 'Ricevute.Detail.Causale', value: rpt.description, wide: true, hide: !rpt.description },
    ];
  });

  /** Trasferimenti reali (RT) — usati per il gating della sezione. */
  readonly transfers = computed<RtTransfer[]>(() => this.ricevuta()?.rt?.transferList?.transfer ?? []);

  /** Righe tabella: trasferimenti + riga di totale (= importo ricevuta). */
  readonly transferRows = computed<RtTransfer[]>(() => {
    const rows = this.transfers();
    const importo = this.ricevuta()?.importo;
    if (!rows.length || importo == null) return rows;
    const totale: RtTransfer = {
      remittanceInformation: this.translate.instant('Ricevute.Detail.Transfer.Totale'),
      transferAmount: String(importo),
    };
    return [...rows, totale];
  });

  /** Colonne: Causale in seconda posizione, Importo come ultima. CF beneficiario
   *  e Categoria omessi per non sforare la larghezza (dati poco consultati e già
   *  desumibili altrove). */
  readonly transferColumns: ColumnDef<RtTransfer>[] = [
    { key: 'idTransfer', header: 'Ricevute.Detail.Transfer.Num', format: (t) => (t.idTransfer ?? '').toString(), align: 'center', width: '3.5rem' },
    { key: 'remittanceInformation', header: 'Ricevute.Detail.Transfer.Causale', format: (t) => t.remittanceInformation ?? '' },
    { key: 'IBAN', header: 'Ricevute.Detail.Transfer.Iban', format: (t) => t.IBAN ?? '', cellClass: 'font-mono text-xs', width: '16rem' },
    { key: 'transferAmount', header: 'Ricevute.Detail.Transfer.Importo', format: (t) => formatEuro(t.transferAmount), align: 'right', cellClass: 'font-mono', width: '8rem' },
  ];

  private siNo(v: boolean | null | undefined): string | undefined {
    if (v == null) return undefined;
    return this.translate.instant(v ? 'Common.Yes' : 'Common.No');
  }

  private tipoSoggetto(t?: string): string | undefined {
    if (!t) return undefined;
    if (t === 'F') return this.translate.instant('Ricevute.Detail.PersonaFisica');
    if (t === 'G') return this.translate.instant('Ricevute.Detail.PersonaGiuridica');
    return t;
  }

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap;
    const idDominio = p.get('idDominio');
    const iuv = p.get('iuv');
    const idRicevuta = p.get('idRicevuta');
    if (!idDominio || !iuv || !idRicevuta) {
      this.router.navigate(['/ricevute']);
      return;
    }
    this.idDominio = idDominio;
    this.iuv = iuv;
    this.idRicevuta = idRicevuta;
    this.system.setBreadcrumbs([{ label: 'Nav.Ricevute', url: '/ricevute' }, { label: iuv }]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idDominio, this.iuv, this.idRicevuta)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((r) => {
        this.ricevuta.set(r);
        this.loading.set(false);
      });
  }

  onDownloadRt(formato: RicevutaFormato): void {
    this.download('rt', formato, this.api.getRtBlob(this.idDominio, this.iuv, this.idRicevuta, formato));
  }

  onDownloadRpt(formato: Exclude<RicevutaFormato, 'pdf'>): void {
    this.download('rpt', formato, this.api.getRptBlob(this.idDominio, this.iuv, this.idRicevuta, formato));
  }

  private download(risorsa: 'rt' | 'rpt', formato: RicevutaFormato, source: Observable<Blob>): void {
    if (this.downloading()) return;
    this.downloading.set(`${risorsa}:${formato}`);
    source
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Ricevute.Detail.DownloadErrore')));
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.downloading.set(null);
        if (!blob) return;
        downloadBlob(blob, `${risorsa}-${this.iuv}-${this.idRicevuta}.${formato}`);
      });
  }
}
