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
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@linkit/shared-ui';
import { SnackbarService } from '@linkit/shared-ui';
import {
  ConfirmDialogComponent,
  DetailSectionComponent,
  DividerComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  downloadBlob,
  formatDate,
  formatEuro,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { PendenzeConsoleApi } from './pendenze.console-api';
import { RicevuteConsoleApi } from '../ricevute/ricevute.console-api';
import type { RtView } from '../ricevute/ricevuta.model';
import { DominiConsoleApi } from '../domini/domini.console-api';
import {
  STATO_PENDENZA_COLOR,
  STATO_PENDENZA_LABEL,
  type Pendenza,
  type RicevutaSummary,
  type Soggetto,
  type VocePendenza,
} from './pendenza.model';
import { voceExtra as buildVoceExtra, type VoceExtra } from './voce-dettaglio';

@Component({
  selector: 'lnk-pendenza-detail',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    DividerComponent,
    InfoGridComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
    ConfirmDialogComponent,
    NgTemplateOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pendenza-detail.component.html',
})
export class PendenzaDetailComponent implements OnInit, OnDestroy {
  private readonly api = inject(PendenzeConsoleApi);
  private readonly ricevuteApi = inject(RicevuteConsoleApi);
  private readonly dominiApi = inject(DominiConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly pendenza = signal<Pendenza | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Object URL del logo dell'ente creditore (null se il dominio non ne ha uno). */
  readonly enteLogoUrl = signal<string | null>(null);

  private idA2A = '';
  private idPendenza = '';

  /** URL del bottone "Indietro": `/pendenze` oppure la ricevuta padre (drilldown annidato). */
  readonly backUrl = signal('/pendenze');

  /* ---- Soggetto pagatore: on-demand con consenso GDPR ---------------- */
  readonly debitore = signal<Soggetto | null>(null);
  readonly debitoreLoading = signal(false);
  readonly askConsenso = signal(false);
  /** Visibilità dei dati debitore: toggle mostra/nascondi (i dati già caricati restano in cache). */
  readonly debitoreVisible = signal(false);
  /** Il link è sempre presente in V2, ma gatiamo comunque sull'`_links`. */
  readonly hasDebitoreLink = computed(() => !!this.pendenza()?._links?.informazioniDebitore);

  /* ---- Avviso: azione PDF gated da `_links.avviso` ------------------- */
  readonly hasAvvisoLink = computed(() => !!this.pendenza()?._links?.avviso);
  readonly avvisoLoading = signal(false);

  /** Download in corso del PDF della ricevuta (RT) per l'azione "Stampa ricevuta". */
  readonly ricevutaPdfLoading = signal(false);

  /* ---- Ricevute: elenco metadata-only ------------------------------- */
  readonly ricevute = signal<RicevutaSummary[] | null>(null);
  /** Vista normalizzata della RT principale (PSP, metodo, …), caricata on-demand nello stato "pagato". */
  readonly ricevutaView = signal<RtView | null>(null);

  /* ---- Stato pendenza: differenzia hero + azioni -------------------- */
  /** `true` per gli stati "conclusi con incasso" → UI stato *Pagato*. */
  readonly isPagato = computed(() => {
    const s = this.pendenza()?.stato;
    return s === 'PAGATA' || s === 'RICONCILIATA';
  });

  /** Titolo = causale della pendenza (fallback all'id se assente). */
  readonly title = computed(() => {
    const p = this.pendenza();
    return p?.causale || p?.idPendenza || '—';
  });

  /** Sottotitolo = tipo pendenza (fallback alla stringa i18n generica). */
  readonly subtitle = computed(
    () => this.pendenza()?.tipoPendenza?.descrizione || 'Pendenze.Detail.Subtitle',
  );

  readonly statoTone = computed(() => {
    const s = this.pendenza()?.stato;
    return s ? STATO_PENDENZA_COLOR[s] : 'muted';
  });

  readonly statoLabelKey = computed(() => {
    const s = this.pendenza()?.stato;
    return s ? STATO_PENDENZA_LABEL[s] : 'Pendenze.Stati.NonPagata';
  });

  /* ---- Hero (differenziato per stato) ------------------------------- */
  /** Importo mostrato nell'hero: pagato → importo effettivamente pagato, altrimenti dovuto. */
  readonly heroImporto = computed(() => {
    const p = this.pendenza();
    if (!p) return '—';
    if (this.isPagato()) {
      return formatEuro(this.ricevutaPrincipale()?.importo ?? p.importo);
    }
    return formatEuro(p.importo);
  });

  readonly heroScadenza = computed(() => {
    const d = this.pendenza()?.dataScadenza;
    return d ? formatDate(d) : null;
  });

  /* ---- Ricevuta principale + blocco "Ricevuta di pagamento" --------- */
  /** RT rappresentativa: preferisce quella accettata dalla PA, altrimenti la prima. */
  readonly ricevutaPrincipale = computed<RicevutaSummary | null>(() => {
    const rt = this.ricevute();
    if (!rt || rt.length === 0) return null;
    return rt.find((r) => r.stato === 'RT_ACCETTATA_PA') ?? rt[0];
  });

  /** Mostra il blocco ricevuta solo se pagato e con una RT associata. */
  readonly hasRicevutaPagamento = computed(() => this.isPagato() && !!this.ricevutaPrincipale());

  /**
   * Link al dettaglio della ricevuta come **drilldown annidato** sotto la
   * pendenza (`/pendenze/:idA2A/:idPendenza/ricevute/:idDominio/:iuv/:idRicevuta`):
   * il detail ricevuta rileva il padre e mostra back + breadcrumb verso la pendenza.
   */
  readonly ricevutaLink = computed<unknown[] | null>(() => {
    const r = this.ricevutaPrincipale();
    return r
      ? ['/pendenze', this.idA2A, this.idPendenza, 'ricevute', r.idDominio, r.iuv, r.idRicevuta]
      : null;
  });

  readonly ricevutaItems = computed<InfoGridItem[]>(() => {
    const r = this.ricevutaPrincipale();
    if (!r) return [];
    const v = this.ricevutaView();
    const idPsp = v?.pspId ?? r.codPsp;
    const dataPag = v?.dataOraPagamento ?? r.dataRicevuta;
    return [
      { labelKey: 'Pendenze.Detail.Psp', value: v?.pspNome, hide: !v?.pspNome },
      { labelKey: 'Pendenze.Detail.IdentificativoPsp', value: idPsp, mono: true, hide: !idPsp },
      { labelKey: 'Pendenze.Detail.DataPagamento', value: formatDate(dataPag), hide: !dataPag },
      { labelKey: 'Pendenze.Detail.MetodoPagamento', value: v?.metodoPagamento, hide: !v?.metodoPagamento },
      { labelKey: 'Pendenze.Detail.IdentificativoRicevuta', value: v?.receiptId ?? r.idRicevuta, mono: true, hide: !(v?.receiptId ?? r.idRicevuta) },
    ];
  });

  /* ---- Griglie info ------------------------------------------------- */
  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Pendenze.Detail.NumeroAvviso', value: p.numeroAvviso, mono: true, hide: !p.numeroAvviso },
      { labelKey: 'Pendenze.Detail.IuvAvviso', value: p.iuvAvviso, mono: true, hide: !p.iuvAvviso },
      { labelKey: 'Pendenze.Detail.IdPendenza', value: p.idPendenza, mono: true },
      { labelKey: 'Pendenze.Detail.IdA2A', value: p.idA2A, mono: true },
      // Font uniforme: anche le date sono `mono` come gli ID (coerenza etichetta/valore).
      { labelKey: 'Pendenze.Detail.DataValidita', value: formatDate(p.dataValidita), mono: true, hide: !p.dataValidita },
      // La scadenza vive nell'hero quando "da pagare"; qui solo se "pagato".
      { labelKey: 'Pendenze.Detail.DataScadenza', value: formatDate(p.dataScadenza), mono: true, hide: !this.isPagato() || !p.dataScadenza },
      { labelKey: 'Pendenze.Detail.DataAggiornamento', value: formatDate(p.dataUltimoAggiornamento), mono: true, hide: !p.dataUltimoAggiornamento },
    ];
  });

  readonly dominioItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [{ labelKey: 'Pendenze.Detail.IdDominio', value: p.dominio?.idDominio, mono: true }];
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

  /* ---- Voci: righe espandibili -------------------------------------- */
  private readonly expandedVoci = signal<ReadonlySet<string>>(new Set());

  formatImportoVoce(v: VocePendenza): string {
    return formatEuro(v.importo);
  }

  voceIndice(v: VocePendenza, i: number): string {
    return v.indice != null ? String(v.indice) : String(i + 1);
  }

  isVoceExpanded(v: VocePendenza): boolean {
    return this.expandedVoci().has(v.idVocePendenza);
  }

  toggleVoce(v: VocePendenza): void {
    const next = new Set(this.expandedVoci());
    if (next.has(v.idVocePendenza)) next.delete(v.idVocePendenza);
    else next.add(v.idVocePendenza);
    this.expandedVoci.set(next);
  }

  /**
   * Dettaglio dinamico per voce (dati aggiuntivi + metadati servizio +
   * contabilità), parsato best-effort dai campi JSON opachi e memoizzato: il
   * template lo interroga più volte (mobile) e così parsa una sola volta per
   * pendenza. Vedi {@link buildVoceExtra}.
   */
  private readonly vociExtraMap = computed<Map<string, VoceExtra>>(() => {
    const map = new Map<string, VoceExtra>();
    for (const v of this.pendenza()?.voci ?? []) map.set(v.idVocePendenza, buildVoceExtra(v));
    return map;
  });

  voceExtra(v: VocePendenza): VoceExtra {
    return this.vociExtraMap().get(v.idVocePendenza) ?? buildVoceExtra(v);
  }

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

    // Drilldown annidato da una ricevuta: back + breadcrumb verso la ricevuta.
    const url = this.router.url ?? '';
    if (url.startsWith('/ricevute/') && params.has('idDominio') && params.has('iuv') && params.has('idRicevuta')) {
      const dom = params.get('idDominio')!;
      const iuv = params.get('iuv')!;
      const ric = params.get('idRicevuta')!;
      const parentUrl = `/ricevute/${encodeURIComponent(dom)}/${encodeURIComponent(iuv)}/${encodeURIComponent(ric)}`;
      this.backUrl.set(parentUrl);
      this.system.setBreadcrumbs([
        { label: 'Nav.Ricevute', url: '/ricevute' },
        { label: iuv, url: parentUrl },
        // Voce non cliccabile (no url): chiarisce che l'ultimo segmento è una pendenza.
        { label: 'Pendenze.Detail.Breadcrumb' },
        { label: idPendenza },
      ]);
    } else {
      this.backUrl.set('/pendenze');
      this.system.setBreadcrumbs([
        { label: 'Nav.Pendenze', url: '/pendenze' },
        { label: idPendenza },
      ]);
    }
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
        if (p) {
          this.fetchRicevute();
          this.fetchEnteLogo(p.dominio.idDominio);
        }
      });
  }

  /** Logo dell'ente creditore (Blob); errore/assenza non bloccante → fallback icona. */
  private fetchEnteLogo(idDominio: string): void {
    this.dominiApi
      .getLogo(idDominio)
      .pipe(catchError(() => of(null)))
      .subscribe((blob) => {
        this.revokeEnteLogo();
        this.enteLogoUrl.set(blob && blob.size > 0 ? URL.createObjectURL(blob) : null);
      });
  }

  private revokeEnteLogo(): void {
    const url = this.enteLogoUrl();
    if (url) URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    this.revokeEnteLogo();
  }

  /** Elenco (metadata-only) delle ricevute; errore non bloccante. */
  private fetchRicevute(): void {
    this.api
      .listRicevute(this.idA2A, this.idPendenza)
      .pipe(catchError(() => of<RicevutaSummary[]>([])))
      .subscribe((r) => {
        this.ricevute.set(r);
        // Nello stato "pagato" arricchiamo il blocco ricevuta con PSP/metodo dal dettaglio RT.
        if (this.isPagato()) this.fetchRicevutaView();
      });
  }

  /** Dettaglio RT (normalizzato) per PSP nome/metodo; errore non bloccante (fallback al summary). */
  private fetchRicevutaView(): void {
    const r = this.ricevutaPrincipale();
    if (!r) return;
    this.ricevuteApi
      .get(r.idDominio, r.iuv, r.idRicevuta)
      .pipe(catchError(() => of(null)))
      .subscribe((ric) => this.ricevutaView.set(ric?.rtView ?? null));
  }

  /* ---- Consenso GDPR + fetch debitore -------------------------------- */
  onMostraDebitore(): void {
    // Già caricato (in una sessione precedente): mostra senza nuovo audit.
    if (this.debitore()) {
      this.debitoreVisible.set(true);
      return;
    }
    this.askConsenso.set(true);
  }

  /** Nasconde i dati (restano in cache: la ri-visualizzazione non rigenera audit). */
  onNascondiDebitore(): void {
    this.debitoreVisible.set(false);
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
        this.debitoreVisible.set(true);
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

  /* ---- Stampa ricevuta PDF (RT della ricevuta principale) ------------ */
  onStampaRicevuta(): void {
    const r = this.ricevutaPrincipale();
    if (!r || this.ricevutaPdfLoading()) return;
    this.ricevutaPdfLoading.set(true);
    this.ricevuteApi
      .getRtBlob(r.idDominio, r.iuv, r.idRicevuta, 'pdf')
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Pendenze.Detail.RicevutaErrore')));
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.ricevutaPdfLoading.set(false);
        if (!blob) return;
        downloadBlob(blob, `ricevuta-${r.iuv}.pdf`);
      });
  }
}
