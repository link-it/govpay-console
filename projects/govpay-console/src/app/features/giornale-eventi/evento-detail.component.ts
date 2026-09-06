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
import { SystemFacade } from '@linkit/shared-ui';
import { SnackbarService } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  ScrollableRegionFocusableDirective,
  StatusBadgeComponent,
  TabsComponent,
  formatDateTime,
  type InfoGridItem,
  type TabDef,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { GiornaleEventiConsoleApi } from './giornale-eventi.console-api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  type Evento,
  type EventoRichiesta,
  type EventoRisposta,
} from './evento.model';

type EventoTab = 'dati' | 'richiesta' | 'risposta';

@Component({
  selector: 'lnk-evento-detail',
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
    ScrollableRegionFocusableDirective,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evento-detail.component.html',
})
export class EventoDetailComponent implements OnInit {
  private readonly api = inject(GiornaleEventiConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly evento = signal<Evento | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<EventoTab>('dati');

  /** Payload richiesta/risposta caricati on-demand (sub-resource) al primo accesso al tab. */
  readonly richiesta = signal<EventoRichiesta | null>(null);
  readonly richiestaLoading = signal(false);
  readonly risposta = signal<EventoRisposta | null>(null);
  readonly rispostaLoading = signal(false);

  /** Presenza dei payload: gata i tab su `_links` del dettaglio. */
  readonly hasRichiesta = computed(() => !!this.evento()?._links?.richiesta);
  readonly hasRisposta = computed(() => !!this.evento()?._links?.risposta);

  readonly tabs = computed<TabDef[]>(() => {
    const tabs: TabDef[] = [{ id: 'dati', labelKey: 'GiornaleEventi.Detail.Tabs.Dati' }];
    if (this.hasRichiesta()) tabs.push({ id: 'richiesta', labelKey: 'GiornaleEventi.Detail.Tabs.Richiesta' });
    if (this.hasRisposta()) tabs.push({ id: 'risposta', labelKey: 'GiornaleEventi.Detail.Tabs.Risposta' });
    return tabs;
  });

  /** Lazy load del payload al primo accesso al tab richiesta/risposta. */
  private readonly _tabLoader = effect(() => {
    const e = this.evento();
    if (!e) return;
    const tab = this.activeTab();
    if (tab === 'richiesta' && this.hasRichiesta() && this.richiesta() === null && !this.richiestaLoading()) {
      this.fetchRichiesta(e.id);
    } else if (tab === 'risposta' && this.hasRisposta() && this.risposta() === null && !this.rispostaLoading()) {
      this.fetchRisposta(e.id);
    }
  });

  readonly esitoTone = computed(() => {
    const e = this.evento();
    return e ? ESITO_EVENTO_COLOR[e.esito] ?? 'muted' : 'muted';
  });
  readonly esitoLabelKey = computed(() => {
    const e = this.evento();
    return e ? ESITO_EVENTO_LABEL[e.esito] : 'GiornaleEventi.Esiti.Ok';
  });

  /**
   * Helper: traduce `key` se esiste in i18n, altrimenti ritorna il `raw`.
   * Usato per mappare `componente`/`tipoEvento` (enum API) su label leggibili.
   */
  private translateOrRaw(key: string, raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const t = this.translate.instant(key);
    return t && t !== key ? t : raw;
  }

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const e = this.evento();
    if (!e) return [];
    return [
      { labelKey: 'GiornaleEventi.Detail.DataEvento', value: formatDateTime(e.dataEvento) },
      {
        labelKey: 'GiornaleEventi.Detail.Categoria',
        // CATEGORIA_EVENTO_LABEL contiene chiavi i18n: risolvile qui perché
        // `<lnk-info-grid>` non applica `| translate` ai value.
        value: e.categoriaEvento ? this.translate.instant(CATEGORIA_EVENTO_LABEL[e.categoriaEvento]) : undefined,
        hide: !e.categoriaEvento,
      },
      {
        labelKey: 'GiornaleEventi.Detail.Componente',
        value: this.translateOrRaw(`GiornaleEventi.Componenti.${e.componente}`, e.componente),
        hide: !e.componente,
      },
      {
        labelKey: 'GiornaleEventi.Detail.Tipo',
        value: this.translateOrRaw(`GiornaleEventi.Tipi.${e.componente}.${e.tipoEvento}`, e.tipoEvento),
        wide: true,
        hide: !e.tipoEvento,
      },
      { labelKey: 'GiornaleEventi.Detail.Sottotipo', value: e.sottotipoEvento, wide: true, hide: !e.sottotipoEvento },
      { labelKey: 'GiornaleEventi.Detail.Ruolo', value: e.ruolo, hide: !e.ruolo },
      {
        labelKey: 'GiornaleEventi.Detail.Durata',
        value: e.durataEventoMs != null ? `${e.durataEventoMs} ms` : undefined,
        hide: e.durataEventoMs == null,
      },
      { labelKey: 'GiornaleEventi.Detail.SottotipoEsito', value: e.sottotipoEsito, mono: true, hide: !e.sottotipoEsito },
      { labelKey: 'GiornaleEventi.Detail.DettaglioEsito', value: e.dettaglioEsito, wide: true, hide: !e.dettaglioEsito },
    ];
  });

  readonly riferimentiItems = computed<InfoGridItem[]>(() => {
    const e = this.evento();
    if (!e) return [];
    return [
      { labelKey: 'GiornaleEventi.Detail.IdDominio', value: e.idDominio, mono: true, hide: !e.idDominio },
      { labelKey: 'GiornaleEventi.Detail.Iuv', value: e.iuv, mono: true, hide: !e.iuv },
      { labelKey: 'GiornaleEventi.Detail.Ccp', value: e.ccp, mono: true, hide: !e.ccp },
      { labelKey: 'GiornaleEventi.Detail.IdA2A', value: e.idA2A, mono: true, hide: !e.idA2A },
      { labelKey: 'GiornaleEventi.Detail.IdPendenza', value: e.idPendenza, mono: true, hide: !e.idPendenza },
      { labelKey: 'GiornaleEventi.Detail.IdPagamento', value: e.idPagamento, mono: true, hide: !e.idPagamento },
      { labelKey: 'GiornaleEventi.Detail.TransactionId', value: e.transactionId, mono: true, hide: !e.transactionId },
      { labelKey: 'GiornaleEventi.Detail.ClusterId', value: e.clusterId, mono: true, hide: !e.clusterId },
    ];
  });

  /** Rotta "Indietro": dipende dal path da cui arriva il drilldown. */
  readonly backUrl = signal<string>('/giornale-eventi');
  readonly backQueryParams = signal<Record<string, string> | null>(null);
  readonly backLabelKey = signal<string>('Common.Back');

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const id = params.get('id');
    if (!id) {
      this.router.navigate(['/giornale-eventi']);
      return;
    }

    // Rileva la rotta padre dal path (drilldown da pendenza/ricevuta):
    // sia "Indietro" sia il breadcrumb passano `?tab=eventi` per riaprire il
    // dettaglio padre sul tab Eventi.
    const url = this.router.url;
    if (url.startsWith('/pendenze/') && params.has('idA2A') && params.has('idPendenza')) {
      const a2a = params.get('idA2A')!;
      const pid = params.get('idPendenza')!;
      const parentUrl = `/pendenze/${encodeURIComponent(a2a)}/${encodeURIComponent(pid)}`;
      this.backUrl.set(parentUrl);
      this.backQueryParams.set({ tab: 'eventi' });
      this.system.setBreadcrumbs([
        { label: 'Nav.Pendenze', url: '/pendenze' },
        { label: pid, url: parentUrl, queryParams: { tab: 'eventi' } },
        { label: 'Nav.GiornaleEventi' },
        { label: id },
      ]);
    } else if (url.startsWith('/ricevute/') && params.has('idDominio') && params.has('iuv')) {
      const dom = params.get('idDominio')!;
      const iuv = params.get('iuv')!;
      const ccp = params.get('ccp');
      const parentUrl = ccp
        ? `/ricevute/${encodeURIComponent(dom)}/${encodeURIComponent(iuv)}/${encodeURIComponent(ccp)}`
        : `/ricevute/${encodeURIComponent(dom)}/${encodeURIComponent(iuv)}`;
      this.backUrl.set(parentUrl);
      this.backQueryParams.set({ tab: 'eventi' });
      this.system.setBreadcrumbs([
        { label: 'Nav.Ricevute', url: '/ricevute' },
        { label: iuv, url: parentUrl, queryParams: { tab: 'eventi' } },
        { label: 'Nav.GiornaleEventi' },
        { label: id },
      ]);
    } else {
      this.system.setBreadcrumbs([
        { label: 'Nav.GiornaleEventi', url: '/giornale-eventi' },
        { label: id },
      ]);
    }

    this.fetch(id);
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(id)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((e) => {
        this.evento.set(e);
        this.loading.set(false);
      });
  }

  private fetchRichiesta(id: number): void {
    this.richiestaLoading.set(true);
    this.api
      .getRichiesta(id)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of<EventoRichiesta>({ headers: [] });
        })
      )
      .subscribe((r) => {
        this.richiesta.set(r);
        this.richiestaLoading.set(false);
      });
  }

  private fetchRisposta(id: number): void {
    this.rispostaLoading.set(true);
    this.api
      .getRisposta(id)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of<EventoRisposta>({ headers: [] });
        })
      )
      .subscribe((r) => {
        this.risposta.set(r);
        this.rispostaLoading.set(false);
      });
  }
}
