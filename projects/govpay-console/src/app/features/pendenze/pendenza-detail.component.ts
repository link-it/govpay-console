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
  formatDate,
  formatDateTime,
  formatEuro,
  formatMsTime,
  truncate,
  type ColumnDef,
  type InfoGridItem,
  type TabDef,
} from '@shared';
import { PendenzeApi } from './pendenze.api';
import {
  STATO_PENDENZA_COLOR,
  STATO_PENDENZA_LABEL,
  type Pendenza,
} from './pendenza.model';
import { GiornaleEventiApi } from '../giornale-eventi/giornale-eventi.api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  severitaToEsito,
  type Evento,
} from '../giornale-eventi/evento.model';

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
    TabsComponent,
    DataTableComponent,
    InfiniteScrollDirective,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pendenza-detail.component.html',
})
export class PendenzaDetailComponent implements OnInit {
  private readonly api = inject(PendenzeApi);
  private readonly eventiApi = inject(GiornaleEventiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly pendenza = signal<Pendenza | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Tabs
  readonly activeTab = signal<'dati' | 'eventi'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati',   labelKey: 'Pendenze.Detail.TabDati' },
    { id: 'eventi', labelKey: 'Pendenze.Detail.TabEventi',
      badge: this.eventi() !== null ? this.eventiTotal() : null,
      badgeLoading: this.eventiLoading() && this.eventi() === null },
  ]);

  // Eventi associati alla pendenza. La prima fetch parte non appena la
  // pendenza è caricata (così il badge del tab mostra il totale reale,
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

  // Effect: appena la pendenza è caricata, fetch della prima pagina di
  // eventi (così il badge del tab è popolato anche se l'utente non apre
  // ancora il tab Eventi).
  private readonly _eventiLoader = effect(() => {
    if (this.eventi() !== null) return;       // già caricati
    if (this.eventiLoading()) return;          // request in volo
    const p = this.pendenza();
    if (!p) return;
    this.fetchEventi(p);
  });

  readonly title = computed(() => {
    const p = this.pendenza();
    return p?.numeroAvviso || p?.iuv || '—';
  });

  readonly statoTone = computed(() => {
    const s = this.pendenza()?.stato;
    return s ? STATO_PENDENZA_COLOR[s] : 'muted';
  });

  readonly statoLabelKey = computed(() => {
    const s = this.pendenza()?.stato;
    return s ? STATO_PENDENZA_LABEL[s] : 'Pendenze.Stati.NonEseguita';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Pendenze.Detail.NumeroAvviso', value: p.numeroAvviso, mono: true },
      { labelKey: 'Pendenze.Detail.Iuv', value: p.iuv, mono: true },
      { labelKey: 'Pendenze.Detail.IdPendenza', value: p.idPendenza, mono: true, hide: !p.idPendenza },
      { labelKey: 'Pendenze.Detail.Tipo', value: p.tipoPendenza?.descrizione },
      { labelKey: 'Pendenze.Detail.Importo', value: formatEuro(p.importo) },
      { labelKey: 'Pendenze.Detail.DataCaricamento', value: formatDate(p.dataCaricamento) },
      { labelKey: 'Pendenze.Detail.DataValidita', value: formatDate(p.dataValidita), hide: !p.dataValidita },
      { labelKey: 'Pendenze.Detail.DataScadenza', value: formatDate(p.dataScadenza), hide: !p.dataScadenza },
      { labelKey: 'Pendenze.Detail.Causale', value: p.causale, wide: true },
    ];
  });

  readonly dominioItems = computed<InfoGridItem[]>(() => {
    const p = this.pendenza();
    if (!p) return [];
    return [
      { labelKey: 'Pendenze.Detail.IdDominio', value: p.dominio?.idDominio || p.idDominio, mono: true },
      {
        labelKey: 'Pendenze.Detail.RagioneSociale',
        value: p.dominio?.ragioneSociale,
        hide: !p.dominio?.ragioneSociale,
      },
      {
        labelKey: 'Pendenze.Detail.UnitaOperativa',
        value: p.unitaOperativa?.ragioneSociale,
        hide: !p.unitaOperativa,
      },
    ];
  });

  readonly pagatoreItems = computed<InfoGridItem[]>(() => {
    const sp = this.pendenza()?.soggettoPagatore;
    if (!sp) return [];
    return [
      { labelKey: 'Pendenze.Detail.Anagrafica', value: sp.anagrafica, wide: true },
      { labelKey: 'Pendenze.Detail.Identificativo', value: sp.identificativo, mono: true },
      {
        labelKey: 'Pendenze.Detail.TipoSoggetto',
        value: sp.tipo === 'F' ? 'Persona fisica' : sp.tipo === 'G' ? 'Persona giuridica' : '',
        hide: !sp.tipo,
      },
      { labelKey: 'Pendenze.Detail.Email', value: sp.email, hide: !sp.email },
      { labelKey: 'Pendenze.Detail.Cellulare', value: sp.cellulare, hide: !sp.cellulare },
    ];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const idA2A = params.get('idA2A');
    const idPendenza = params.get('idPendenza');
    if (!idA2A || !idPendenza) {
      this.router.navigate(['/pendenze']);
      return;
    }
    // `?tab=eventi` (es. dal back del dettaglio evento) → apri sul tab Eventi.
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'eventi' || tabParam === 'dati') this.activeTab.set(tabParam);
    this.system.setBreadcrumbs([
      { label: 'Nav.Pendenze', url: '/pendenze' },
      { label: idPendenza },
    ]);
    this.fetch(idA2A, idPendenza);
  }

  private fetch(idA2A: string, idPendenza: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(idA2A, idPendenza)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((p) => {
        this.pendenza.set(p);
        this.loading.set(false);
      });
  }

  /** Prima fetch (pagina 1) degli eventi del giornale filtrati sulla pendenza. */
  private fetchEventi(p: Pendenza): void {
    this.eventiPage.set(1);
    this.fetchEventiPage(p, false);
  }

  loadMoreEventi(): void {
    if (!this.eventiCanLoadMore()) return;
    const p = this.pendenza();
    if (!p) return;
    this.eventiPage.update((n) => n + 1);
    this.fetchEventiPage(p, true);
  }

  private fetchEventiPage(p: Pendenza, append: boolean): void {
    this.eventiLoading.set(true);
    const pageSize = PendenzaDetailComponent.EVENTI_PAGE_SIZE;
    // Filtri: codApplicazione + idPendenza è la chiave canonica della
    // pendenza (sempre presente). Aggiungiamo idDominio + iuv se valorizzati,
    // così otteniamo lo stesso scope del legacy `dashboard-view` (il backend
    // li utilizza in AND).
    this.eventiApi
      .list({
        codApplicazione: p.idA2A,
        idPendenza: p.idPendenza,
        idDominio: p.dominio?.idDominio || p.idDominio,
        iuv: p.iuv,
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
    const p = this.pendenza();
    if (!p?.idA2A || !p?.idPendenza) {
      // fallback: rotta principale del giornale eventi
      this.router.navigate(['/giornale-eventi', e.id]);
      return;
    }
    // Drilldown nested: il breadcrumb e il bottone "Indietro" del
    // dettaglio evento riporteranno qui (sul dettaglio della pendenza).
    this.router.navigate(['/pendenze', p.idA2A, p.idPendenza, 'eventi', e.id]);
  }
}
