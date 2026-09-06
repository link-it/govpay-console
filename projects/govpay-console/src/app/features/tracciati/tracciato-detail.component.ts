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
import { catchError, of, type Observable } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade, SnackbarService } from '@linkit/shared-ui';
import {
  DataTableComponent,
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  InfiniteScrollDirective,
  PageHeaderComponent,
  StatusBadgeComponent,
  TabsComponent,
  downloadBlob,
  formatDateTime,
  type ColumnDef,
  type InfoGridItem,
  type TabDef,
} from '@linkit/shared-ui';
import { problemDetail, sliceHasMore, type Slice } from '@core/models';
import { TracciatiConsoleApi } from './tracciati.console-api';
import {
  STATO_OPERAZIONE_COLOR,
  STATO_OPERAZIONE_LABEL,
  STATO_TRACCIATO_COLOR,
  STATO_TRACCIATO_LABEL,
  TIPO_OPERAZIONE_LABEL,
  type OperazionePendenzaSummary,
  type Tracciato,
} from './tracciato.model';

type TracciatoTab = 'dati' | 'operazioni';
const OP_PAGE_SIZE = 25;

@Component({
  selector: 'lnk-tracciato-detail',
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
    InfiniteScrollDirective,
    DataTableComponent,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracciato-detail.component.html',
})
export class TracciatoDetailComponent implements OnInit {
  private readonly api = inject(TracciatiConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private id = '';
  readonly tracciato = signal<Tracciato | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly downloading = signal<string | null>(null);

  readonly activeTab = signal<TracciatoTab>('dati');

  /** Operazioni (tab lazy, paginazione cursor). */
  readonly operazioni = signal<OperazionePendenzaSummary[] | null>(null);
  readonly operazioniLoading = signal(false);
  readonly operazioniHasMore = signal(false);
  private readonly operazioniCursor = signal<string | undefined>(undefined);

  readonly hasRichiesta = computed(() => !!this.tracciato()?._links?.richiesta);
  readonly hasEsito = computed(() => !!this.tracciato()?._links?.esito);
  readonly hasStampe = computed(() => !!this.tracciato()?._links?.stampe);

  readonly tabs = computed<TabDef[]>(() => {
    const t = this.tracciato();
    const opCount = t?.numeroOperazioniTotali;
    return [
      { id: 'dati', labelKey: 'Tracciati.Detail.Tabs.Dati' },
      { id: 'operazioni', labelKey: 'Tracciati.Detail.Tabs.Operazioni', badge: opCount != null ? String(opCount) : undefined },
    ];
  });

  /** Lazy load delle operazioni al primo accesso al tab. */
  private readonly _tabLoader = effect(() => {
    const t = this.tracciato();
    if (!t) return;
    if (this.activeTab() === 'operazioni' && this.operazioni() === null && !this.operazioniLoading()) {
      this.fetchOperazioni(false);
    }
  });

  readonly statoTone = computed(() => {
    const s = this.tracciato()?.stato;
    return s ? STATO_TRACCIATO_COLOR[s] : 'muted';
  });
  readonly statoLabelKey = computed(() => {
    const s = this.tracciato()?.stato;
    return s ? STATO_TRACCIATO_LABEL[s] : 'Tracciati.Stati.InAttesa';
  });

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const t = this.tracciato();
    if (!t) return [];
    return [
      { labelKey: 'Tracciati.Detail.NomeFile', value: t.nomeFile, mono: true, wide: true },
      { labelKey: 'Tracciati.Detail.Formato', value: t.formatoRichiesta },
      { labelKey: 'Tracciati.Detail.DataCaricamento', value: formatDateTime(t.dataOraCaricamento) },
      { labelKey: 'Tracciati.Detail.DataAggiornamento', value: t.dataOraUltimoAggiornamento ? formatDateTime(t.dataOraUltimoAggiornamento) : undefined, hide: !t.dataOraUltimoAggiornamento },
      { labelKey: 'Tracciati.Detail.Operatore', value: t.operatoreMittente, hide: !t.operatoreMittente },
      { labelKey: 'Tracciati.Detail.DescrizioneStato', value: t.descrizioneStato ?? undefined, wide: true, hide: !t.descrizioneStato },
    ];
  });

  readonly enteItems = computed<InfoGridItem[]>(() => {
    const dom = this.tracciato()?.dominio;
    if (!dom) return [];
    return [
      { labelKey: 'Tracciati.Detail.IdDominio', value: dom.idDominio, mono: true },
      { labelKey: 'Tracciati.Detail.RagioneSociale', value: dom.ragioneSociale, hide: !dom.ragioneSociale },
    ];
  });

  readonly contatoriItems = computed<InfoGridItem[]>(() => {
    const t = this.tracciato();
    if (!t) return [];
    const num = (n?: number | null): string => (n != null ? String(n) : '0');
    return [
      { labelKey: 'Tracciati.Detail.OperazioniTotali', value: num(t.numeroOperazioniTotali) },
      { labelKey: 'Tracciati.Detail.OperazioniEseguite', value: num(t.numeroOperazioniEseguite) },
      { labelKey: 'Tracciati.Detail.OperazioniFallite', value: num(t.numeroOperazioniFallite) },
      { labelKey: 'Tracciati.Detail.AvvisiTotali', value: num(t.numeroAvvisiTotali), hide: t.numeroAvvisiTotali == null },
      { labelKey: 'Tracciati.Detail.AvvisiStampati', value: num(t.numeroAvvisiStampati), hide: t.numeroAvvisiStampati == null },
      { labelKey: 'Tracciati.Detail.AvvisiFalliti', value: num(t.numeroAvvisiFalliti), hide: t.numeroAvvisiFalliti == null },
    ];
  });

  readonly operazioniColumns = computed<ColumnDef<OperazionePendenzaSummary>[]>(() => [
    { key: 'numero', header: 'Tracciati.Operazioni.Columns.Numero', format: (o) => String(o.numero), align: 'right', cellClass: 'font-mono text-xs', width: '5rem' },
    { key: 'tipoOperazione', header: 'Tracciati.Operazioni.Columns.Tipo', format: (o) => this.translate.instant(TIPO_OPERAZIONE_LABEL[o.tipoOperazione] ?? o.tipoOperazione), width: '8rem' },
    { key: 'identificativoPendenza', header: 'Tracciati.Operazioni.Columns.Pendenza', format: (o) => o.identificativoPendenza || '—', cellClass: 'font-mono text-xs' },
    { key: 'numeroAvviso', header: 'Tracciati.Operazioni.Columns.Avviso', format: (o) => o.numeroAvviso || '—', cellClass: 'font-mono text-xs' },
    {
      key: 'stato',
      header: 'Tracciati.Operazioni.Columns.Stato',
      cellType: 'badge',
      cellTone: (o) => STATO_OPERAZIONE_COLOR[o.stato] ?? 'muted',
      format: (o) => STATO_OPERAZIONE_LABEL[o.stato] ?? o.stato,
      width: '9rem',
    },
  ]);

  readonly operazioniCanLoadMore = computed(() => this.operazioniHasMore() && !this.operazioniLoading());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tracciati']);
      return;
    }
    this.id = id;
    this.system.setBreadcrumbs([
      { label: 'Nav.Tracciati', url: '/tracciati' },
      { label: id },
    ]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.id)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((t) => {
        this.tracciato.set(t);
        this.loading.set(false);
      });
  }

  loadMoreOperazioni(): void {
    if (!this.operazioniCanLoadMore()) return;
    this.fetchOperazioni(true);
  }

  private fetchOperazioni(append: boolean): void {
    this.operazioniLoading.set(true);
    this.api
      .listOperazioni(this.id, append ? { cursor: this.operazioniCursor(), limit: OP_PAGE_SIZE } : { limit: OP_PAGE_SIZE })
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of<Slice<OperazionePendenzaSummary>>({ results: [] });
        })
      )
      .subscribe((slice) => {
        const results = slice.results ?? [];
        this.operazioni.update((prev) => (append && prev ? [...prev, ...results] : results));
        this.operazioniCursor.set(slice.nextCursor);
        this.operazioniHasMore.set(sliceHasMore(slice));
        this.operazioniLoading.set(false);
      });
  }

  onOperazioneClick(o: OperazionePendenzaSummary): void {
    this.router.navigate(['/tracciati', this.id, 'operazioni', o.numero]);
  }

  onDownloadRichiesta(): void {
    const t = this.tracciato();
    if (!t) return;
    this.download(`richiesta:${t.id}`, this.api.getRichiestaBlob(t.id, t.formatoRichiesta), `tracciato-${t.id}-richiesta.${t.formatoRichiesta.toLowerCase()}`);
  }

  onDownloadEsito(): void {
    const t = this.tracciato();
    if (!t) return;
    this.download(`esito:${t.id}`, this.api.getEsitoBlob(t.id, t.formatoRichiesta), `tracciato-${t.id}-esito.${t.formatoRichiesta.toLowerCase()}`);
  }

  onDownloadStampe(): void {
    const t = this.tracciato();
    if (!t) return;
    this.download(`stampe:${t.id}`, this.api.getStampeBlob(t.id), `tracciato-${t.id}-stampe.zip`);
  }

  private download(key: string, source: Observable<Blob>, filename: string): void {
    if (this.downloading()) return;
    this.downloading.set(key);
    source
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Tracciati.Detail.DownloadErrore')));
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.downloading.set(null);
        if (!blob) return;
        downloadBlob(blob, filename);
      });
  }
}
