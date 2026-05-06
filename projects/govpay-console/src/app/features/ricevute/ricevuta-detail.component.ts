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
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@core/system';
import { SnackbarService } from '@core/ui';
import {
  DataTableComponent,
  DetailSectionComponent,
  EmptyStateComponent,
  InfiniteScrollDirective,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  TabsComponent,
  formatDateTime,
  formatEuro,
  formatMsTime,
  truncate,
  type ColumnDef,
  type InfoGridItem,
  type TabDef,
} from '@shared';
import { RicevuteApi } from './ricevute.api';
import { STATO_RPP_COLOR, STATO_RPP_LABEL, type Ricevuta } from './ricevuta.model';
import { GiornaleEventiApi } from '../giornale-eventi/giornale-eventi.api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  severitaToEsito,
  type Evento,
} from '../giornale-eventi/evento.model';

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
    TabsComponent,
    DataTableComponent,
    InfiniteScrollDirective,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ricevuta-detail.component.html',
})
export class RicevutaDetailComponent implements OnInit {
  private readonly api = inject(RicevuteApi);
  private readonly eventiApi = inject(GiornaleEventiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly ricevuta = signal<Ricevuta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Tabs
  readonly activeTab = signal<'dati' | 'eventi'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati',   labelKey: 'Ricevute.Detail.TabDati' },
    { id: 'eventi', labelKey: 'Ricevute.Detail.TabEventi',
      badge: this.eventi() !== null ? this.eventiTotal() : null,
      badgeLoading: this.eventiLoading() && this.eventi() === null },
  ]);

  // Eventi associati alla ricevuta. La prima fetch parte non appena la
  // ricevuta è caricata (così il badge del tab mostra il totale reale,
  // anche prima che l'utente apra il tab). `eventi === null` significa
  // "non ancora caricati"; ulteriori pagine via infinite-scroll.
  readonly eventi = signal<Evento[] | null>(null);
  readonly eventiTotal = signal(0);
  readonly eventiPage = signal(1);
  readonly eventiLoading = signal(false);
  private static readonly EVENTI_PAGE_SIZE = 25;
  readonly eventiHasMore = computed(() => (this.eventi()?.length ?? 0) < this.eventiTotal());
  readonly eventiCanLoadMore = computed(() => this.eventiHasMore() && !this.eventiLoading());
  readonly eventiColumns = computed<ColumnDef<Evento>[]>(() => [
    {
      key: 'dataEvento',
      header: 'GiornaleEventi.Columns.Data',
      format: (r) => formatDateTime(r.dataEvento),
      cellClass: 'font-mono text-xs',
      width: '12rem',
    },
    {
      key: 'categoriaEvento',
      header: 'GiornaleEventi.Columns.Categoria',
      format: (r) => (r.categoriaEvento ? CATEGORIA_EVENTO_LABEL[r.categoriaEvento] : '—'),
      width: '8rem',
    },
    {
      key: 'tipoEvento',
      header: 'GiornaleEventi.Columns.Tipo',
      format: (r) => truncate([r.tipoEvento, r.sottotipoEvento].filter(Boolean).join(' / ') || '—', 60),
    },
    {
      key: 'durataEvento',
      header: 'GiornaleEventi.Columns.Durata',
      format: (r) => (r.durataEvento != null ? formatMsTime(r.durataEvento) : '—'),
      align: 'right',
      cellClass: 'font-mono text-xs',
      width: '6rem',
    },
    {
      key: 'esito',
      header: 'GiornaleEventi.Columns.Esito',
      cellType: 'badge',
      cellTone: (r) => ESITO_EVENTO_COLOR[r.esito ?? severitaToEsito(r.severita)] ?? 'muted',
      format: (r) => ESITO_EVENTO_LABEL[r.esito ?? severitaToEsito(r.severita)] ?? '—',
      width: '7rem',
    },
  ]);

  /** Effect: appena la ricevuta è caricata, fetch della prima pagina di
   *  eventi (così il badge del tab è popolato anche se l'utente non apre
   *  ancora il tab Eventi). */
  private readonly _eventiLoader = effect(() => {
    if (this.eventi() !== null) return;
    if (this.eventiLoading()) return;
    const r = this.ricevuta();
    if (!r) return;
    this.fetchEventi(r);
  });

  readonly iuvDisplay = computed(() => {
    const r = this.ricevuta();
    return r?.pendenza?.iuvPagamento || r?.pendenza?.iuvAvviso || '—';
  });

  readonly statoTone = computed(() => {
    const s = this.ricevuta()?.stato;
    return s ? STATO_RPP_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.ricevuta()?.stato;
    return s ? STATO_RPP_LABEL[s] : 'Ricevute.Stati.InCorso';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const r = this.ricevuta();
    if (!r) return [];
    const dataPagamento = r.rt?.paymentDateTime || r.pendenza?.dataPagamento;
    return [
      { labelKey: 'Ricevute.Detail.Iuv', value: this.iuvDisplay(), mono: true },
      { labelKey: 'Ricevute.Detail.NumeroAvviso', value: r.pendenza?.numeroAvviso, mono: true, hide: !r.pendenza?.numeroAvviso },
      { labelKey: 'Ricevute.Detail.DataRicevuta', value: dataPagamento ? formatDateTime(dataPagamento) : undefined, hide: !dataPagamento },
      {
        labelKey: 'Ricevute.Detail.Importo',
        value: formatEuro(r.pendenza?.importoPagato ?? r.pendenza?.importo),
      },
      { labelKey: 'Ricevute.Detail.Causale', value: r.pendenza?.causale, wide: true, hide: !r.pendenza?.causale },
    ];
  });

  readonly dominioItems = computed<InfoGridItem[]>(() => {
    const dom = this.ricevuta()?.pendenza?.dominio;
    if (!dom) return [];
    return [
      { labelKey: 'Ricevute.Detail.IdDominio', value: dom.idDominio, mono: true },
      { labelKey: 'Ricevute.Detail.RagioneSociale', value: dom.ragioneSociale, hide: !dom.ragioneSociale },
    ];
  });

  readonly pagatoreItems = computed<InfoGridItem[]>(() => {
    const sp = this.ricevuta()?.pendenza?.soggettoPagatore;
    if (!sp) return [];
    return [
      { labelKey: 'Ricevute.Detail.Anagrafica', value: sp.anagrafica, wide: true },
      { labelKey: 'Ricevute.Detail.Identificativo', value: sp.identificativo, mono: true },
      { labelKey: 'Ricevute.Detail.Email', value: sp.email, hide: !sp.email },
    ];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idDominio = params.get('idDominio');
    const iuv = params.get('iuv');
    const ccp = params.get('ccp') ?? '';
    if (!idDominio || !iuv) {
      this.router.navigate(['/ricevute']);
      return;
    }
    // `?tab=eventi` (es. dal back del dettaglio evento) → apri sul tab Eventi.
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'eventi' || tabParam === 'dati') this.activeTab.set(tabParam);
    this.system.setBreadcrumbs([
      { label: 'Nav.Ricevute', url: '/ricevute' },
      { label: iuv },
    ]);
    this.fetch(idDominio, iuv, ccp);
  }

  private fetch(idDominio: string, iuv: string, ccp: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(idDominio, iuv, ccp)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
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

  /** Prima fetch (pagina 1) degli eventi del giornale filtrati sulla ricevuta. */
  private fetchEventi(r: Ricevuta): void {
    this.eventiPage.set(1);
    this.fetchEventiPage(r, false);
  }

  loadMoreEventi(): void {
    if (!this.eventiCanLoadMore()) return;
    const r = this.ricevuta();
    if (!r) return;
    this.eventiPage.update((n) => n + 1);
    this.fetchEventiPage(r, true);
  }

  private fetchEventiPage(r: Ricevuta, append: boolean): void {
    this.eventiLoading.set(true);
    const pageSize = RicevutaDetailComponent.EVENTI_PAGE_SIZE;
    // Per le RPP usiamo iuv + idDominio come chiave principale; quando
    // disponibili aggiungiamo anche codApplicazione + idPendenza per
    // restringere ulteriormente al record specifico.
    this.eventiApi
      .list({
        iuv: r.pendenza?.iuvPagamento || r.pendenza?.iuvAvviso,
        idDominio: r.pendenza?.dominio?.idDominio,
        codApplicazione: r.pendenza?.idA2A,
        idPendenza: r.pendenza?.idPendenza,
        pagina: this.eventiPage(),
        risPerPagina: pageSize,
      })
      .pipe(
        catchError(() => of({ risultati: [], numRisultati: 0, numPagine: 1, pagina: 1, risPerPagina: pageSize })),
      )
      .subscribe((page) => {
        const results = page.risultati ?? [];
        if (append) this.eventi.update((prev) => [...(prev ?? []), ...results]);
        else this.eventi.set(results);
        this.eventiTotal.set(page.numRisultati ?? 0);
        this.eventiLoading.set(false);
      });
  }

  onEventClick(e: Evento): void {
    if (e.id == null) return;
    const params = this.route.snapshot.paramMap;
    const idDominio = params.get('idDominio');
    const iuv = params.get('iuv');
    const ccp = params.get('ccp');
    if (!idDominio || !iuv) {
      this.router.navigate(['/giornale-eventi', e.id]);
      return;
    }
    // Drilldown nested: il breadcrumb e il bottone "Indietro" del
    // dettaglio evento riporteranno sul dettaglio della ricevuta.
    const segments = ['/ricevute', idDominio, iuv];
    if (ccp) segments.push(ccp);
    segments.push('eventi', String(e.id));
    this.router.navigate(segments);
  }
}
