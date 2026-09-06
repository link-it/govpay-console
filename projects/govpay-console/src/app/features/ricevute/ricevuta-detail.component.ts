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
import {
  statoRtColor,
  statoRtLabel,
  type Ricevuta,
  type RicevutaFormato,
  type RptView,
  type RtTransferView,
  type RtView,
} from './ricevuta.model';

/** Tiene solo gli item valorizzati: le sezioni gated su `items().length` così si
 *  nascondono automaticamente quando non hanno contenuto reale. */
function compact(items: InfoGridItem[]): InfoGridItem[] {
  return items.filter((i) => i.value != null && i.value !== '');
}

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

  /** Viste RT/RPT normalizzate al confine dell'API (vedi `RicevuteConsoleApi.get`). */
  private readonly rtView = computed<RtView>(() => this.ricevuta()?.rtView ?? { transfers: [] });
  private readonly rptView = computed<RptView>(() => this.ricevuta()?.rptView ?? {});

  /** Esito pagamento (RT). */
  readonly esitoRtItems = computed<InfoGridItem[]>(() => {
    const v = this.rtView();
    return compact([
      { labelKey: 'Ricevute.Detail.Esito', value: v.esito },
      { labelKey: 'Ricevute.Detail.ImportoPagato', value: v.importoPagato != null ? formatEuro(v.importoPagato) : undefined },
      { labelKey: 'Ricevute.Detail.Commissione', value: v.commissione != null ? formatEuro(v.commissione) : undefined },
      { labelKey: 'Ricevute.Detail.MetodoPagamento', value: v.metodoPagamento },
      { labelKey: 'Ricevute.Detail.DataOraPagamento', value: v.dataOraPagamento ? formatDateTime(v.dataOraPagamento) : undefined },
      { labelKey: 'Ricevute.Detail.DataApplicazione', value: v.dataContabile ? formatDate(v.dataContabile) : undefined },
      { labelKey: 'Ricevute.Detail.DataTrasferimento', value: v.dataTrasferimento ? formatDate(v.dataTrasferimento) : undefined },
      { labelKey: 'Ricevute.Detail.ReceiptId', value: v.receiptId, mono: true },
      { labelKey: 'Ricevute.Detail.NumeroAvviso', value: v.numeroAvviso, mono: true },
    ]);
  });

  /** Versante / debitore (RT). */
  readonly versanteItems = computed<InfoGridItem[]>(() => {
    const v = this.rtView();
    return compact([
      { labelKey: 'Ricevute.Detail.Anagrafica', value: v.versanteNome },
      { labelKey: 'Ricevute.Detail.TipoSoggetto', value: this.tipoSoggetto(v.versanteTipo) },
      { labelKey: 'Ricevute.Detail.Identificativo', value: v.versanteId, mono: true },
      { labelKey: 'Ricevute.Detail.Email', value: v.versanteEmail },
    ]);
  });

  /** Prestatore servizi di pagamento (RT). */
  readonly pspItems = computed<InfoGridItem[]>(() => {
    const v = this.rtView();
    return compact([
      { labelKey: 'Ricevute.Detail.PspDenominazione', value: v.pspNome },
      { labelKey: 'Ricevute.Detail.PspId', value: v.pspId, mono: true },
      { labelKey: 'Ricevute.Detail.PspFiscalCode', value: v.pspCf, mono: true },
      { labelKey: 'Ricevute.Detail.Canale', value: v.canale },
    ]);
  });

  /** Ente creditore (RT). */
  readonly enteItems = computed<InfoGridItem[]>(() => {
    const v = this.rtView();
    return compact([
      { labelKey: 'Ricevute.Detail.EnteDenominazione', value: v.enteNome },
      { labelKey: 'Ricevute.Detail.EnteFiscalCode', value: v.enteCf, mono: true },
      { labelKey: 'Ricevute.Detail.CreditorReferenceId', value: v.iuv, mono: true },
      { labelKey: 'Ricevute.Detail.Causale', value: v.causale, wide: true },
    ]);
  });

  /** Richiesta di pagamento (RPT), quando disponibile. */
  readonly rptItems = computed<InfoGridItem[]>(() => {
    const v = this.rptView();
    return compact([
      { labelKey: 'Ricevute.Detail.ImportoRichiesto', value: v.importoRichiesto != null ? formatEuro(v.importoRichiesto) : undefined },
      { labelKey: 'Ricevute.Detail.Scadenza', value: v.scadenza ? formatDate(v.scadenza) : undefined },
      { labelKey: 'Ricevute.Detail.DataEsecuzione', value: v.dataEsecuzione ? formatDate(v.dataEsecuzione) : undefined },
      { labelKey: 'Ricevute.Detail.TipoVersamento', value: v.tipoVersamento },
      { labelKey: 'Ricevute.Detail.UltimoPagamento', value: this.siNo(v.ultimoPagamento) },
      { labelKey: 'Ricevute.Detail.CreditorReferenceId', value: v.iuv, mono: true },
      { labelKey: 'Ricevute.Detail.Causale', value: v.causale, wide: true },
    ]);
  });

  /** Trasferimenti normalizzati — usati per il gating della sezione. */
  readonly transfers = computed<RtTransferView[]>(() => this.rtView().transfers);

  /** Righe tabella: trasferimenti + riga di totale (= importo ricevuta). */
  readonly transferRows = computed<RtTransferView[]>(() => {
    const rows = this.transfers();
    const importo = this.ricevuta()?.importo;
    if (!rows.length || importo == null) return rows;
    return [...rows, { causale: this.translate.instant('Ricevute.Detail.Transfer.Totale'), importo: String(importo) }];
  });

  /** Colonne: Causale in seconda posizione, Importo come ultima. */
  readonly transferColumns: ColumnDef<RtTransferView>[] = [
    { key: 'num', header: 'Ricevute.Detail.Transfer.Num', format: (t) => (t.num ?? '').toString(), align: 'center', width: '3.5rem' },
    { key: 'causale', header: 'Ricevute.Detail.Transfer.Causale', format: (t) => t.causale ?? '' },
    { key: 'iban', header: 'Ricevute.Detail.Transfer.Iban', format: (t) => t.iban ?? '', cellClass: 'font-mono text-xs', width: '16rem' },
    { key: 'importo', header: 'Ricevute.Detail.Transfer.Importo', format: (t) => formatEuro(t.importo), align: 'right', cellClass: 'font-mono', width: '8rem' },
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
