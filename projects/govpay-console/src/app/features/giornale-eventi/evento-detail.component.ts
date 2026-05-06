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
import { SystemFacade } from '@core/system';
import { SnackbarService } from '@core/ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  formatDateTime,
  type InfoGridItem,
} from '@shared';
import { GiornaleEventiApi } from './giornale-eventi.api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  severitaToEsito,
  type EventoDetail,
} from './evento.model';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evento-detail.component.html',
})
export class EventoDetailComponent implements OnInit {
  private readonly api = inject(GiornaleEventiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly evento = signal<EventoDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly esitoTone = computed(() => {
    const e = this.evento();
    if (!e) return 'muted';
    const esito = e.esito ?? severitaToEsito(e.severita);
    return ESITO_EVENTO_COLOR[esito] ?? 'muted';
  });
  readonly esitoLabelKey = computed(() => {
    const e = this.evento();
    if (!e) return 'GiornaleEventi.Esiti.Ok';
    const esito = e.esito ?? severitaToEsito(e.severita);
    return ESITO_EVENTO_LABEL[esito];
  });

  /**
   * Helper: traduce `key` se la chiave esiste in i18n, altrimenti
   * ritorna il `raw` come fallback. Usata per mappare `componente` e
   * `tipoEvento` (enum dell'API GovPay) sulle label leggibili importate
   * dal legacy (`mappingTipiEvento.govpay`).
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
        // CATEGORIA_EVENTO_LABEL contiene chiavi i18n; risolvile qui
        // perché `<lnk-info-grid>` non applica `| translate` ai value.
        value: e.categoriaEvento
          ? this.translate.instant(CATEGORIA_EVENTO_LABEL[e.categoriaEvento])
          : undefined,
        hide: !e.categoriaEvento,
      },
      {
        labelKey: 'GiornaleEventi.Detail.Componente',
        value: this.translateOrRaw(`GiornaleEventi.Componenti.${e.componente}`, e.componente),
        hide: !e.componente,
      },
      {
        labelKey: 'GiornaleEventi.Detail.Tipo',
        value: this.translateOrRaw(
          `GiornaleEventi.Tipi.${e.componente}.${e.tipoEvento}`,
          e.tipoEvento
        ),
        wide: true,
        hide: !e.tipoEvento,
      },
      { labelKey: 'GiornaleEventi.Detail.Sottotipo', value: e.sottotipoEvento, wide: true, hide: !e.sottotipoEvento },
      { labelKey: 'GiornaleEventi.Detail.Ruolo', value: e.ruolo, hide: !e.ruolo },
      {
        labelKey: 'GiornaleEventi.Detail.Durata',
        value: e.durataEvento != null ? `${e.durataEvento} ms` : undefined,
        hide: e.durataEvento == null,
      },
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
      { labelKey: 'GiornaleEventi.Detail.IdSessione', value: e.idSessione, mono: true, hide: !e.idSessione },
    ];
  });

  /** Rotta "Indietro": dipende dal path da cui arriva il drilldown
   *  (lista eventi, dettaglio pendenza, dettaglio ricevuta). */
  readonly backUrl = signal<string>('/giornale-eventi');
  /** Query params opzionali del bottone Indietro (es. `{ tab: 'eventi' }`
   *  per riaprire il dettaglio padre con il tab Eventi attivo). */
  readonly backQueryParams = signal<Record<string, string> | null>(null);
  /** Label i18n del bottone "Indietro" (di default `Common.Back`). */
  readonly backLabelKey = signal<string>('Common.Back');

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const id = params.get('id');
    if (!id) {
      this.router.navigate(['/giornale-eventi']);
      return;
    }

    // Rileva la rotta padre dal path (es. `/pendenze/{idA2A}/{idPendenza}/eventi/{id}`).
    // Quando il drilldown viene da pendenza/ricevuta, sia il bottone
    // "Indietro" sia il breadcrumb passano `?tab=eventi` così la maschera
    // padre apre direttamente sul tab Eventi.
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

  formatJson(payload: Record<string, unknown> | undefined): string {
    if (!payload) return '';
    return JSON.stringify(payload, null, 2);
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(id)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
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
}
