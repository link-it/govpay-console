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
  input,
  output,
  signal,
} from '@angular/core';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import {
  EmptyStateComponent,
  InfoGridComponent,
  LoadingComponent,
  StatusBadgeComponent,
  downloadBlob,
  formatDateTime,
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { GiornaleEventiConsoleApi } from './giornale-eventi.console-api';
import {
  CATEGORIA_EVENTO_LABEL,
  ESITO_EVENTO_COLOR,
  ESITO_EVENTO_LABEL,
  type Evento,
  type EventoHeader,
  type EventoListFilters,
  type EventoSummary,
} from './evento.model';

/**
 * Timeline degli eventi (giornale eventi) filtrati per un contesto — pendenza
 * (`{ idA2A, idPendenza }`), ricevuta (`{ idDominio, iuv, ccp }`), ecc.
 * Riutilizzabile in qualunque detail: si aggancia via `filters`, carica gli
 * eventi da sé e ne emette il conteggio (`count`) per il badge del tab.
 *
 * Ogni nodo è espandibile: al primo apri carica il dettaglio evento
 * (`get(id)` → `_links`/dimensioni) e permette il download dei messaggi HTTP
 * (richiesta/risposta) come file `.txt` (header + payload).
 */
@Component({
  selector: 'lnk-eventi-timeline',
  standalone: true,
  imports: [NgIcon, TranslatePipe, StatusBadgeComponent, InfoGridComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eventi-timeline.component.html',
})
export class EventiTimelineComponent implements OnInit {
  private readonly api = inject(GiornaleEventiConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  /** Contesto di filtro (es. `{ idA2A, idPendenza }`). */
  readonly filters = input.required<EventoListFilters>();
  /** Numero massimo di eventi da caricare. */
  readonly limit = input(100);
  /** Conteggio eventi caricati (per il badge del tab del parent). */
  readonly count = output<number>();

  readonly events = signal<EventoSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly expanded = signal<ReadonlySet<number>>(new Set());
  /** Dettaglio completo (con `_links`/dimensioni) caricato al primo espandere. */
  private readonly details = signal<ReadonlyMap<number, Evento>>(new Map());
  private readonly detailLoading = signal<ReadonlySet<number>>(new Set());
  /** Chiave del download in corso (`<id>:richiesta`/`:risposta`). */
  readonly downloading = signal<string | null>(null);

  /** Emette il conteggio quando la lista cambia (per il badge del tab). */
  private readonly _emitCount = effect(() => this.count.emit(this.events().length));

  ngOnInit(): void {
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({ ...this.filters(), limit: this.limit() })
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          return of({ results: [] as EventoSummary[] } as { results: EventoSummary[] });
        }),
      )
      .subscribe((slice) => {
        this.events.set(slice.results ?? []);
        this.loading.set(false);
      });
  }

  isOpen(id: number): boolean {
    return this.expanded().has(id);
  }

  toggle(e: EventoSummary): void {
    const next = new Set(this.expanded());
    if (next.has(e.id)) {
      next.delete(e.id);
    } else {
      next.add(e.id);
      if (!this.details().has(e.id)) this.fetchDetail(e.id);
    }
    this.expanded.set(next);
  }

  detail(id: number): Evento | undefined {
    return this.details().get(id);
  }

  isDetailLoading(id: number): boolean {
    return this.detailLoading().has(id);
  }

  private fetchDetail(id: number): void {
    this.detailLoading.update((s) => new Set(s).add(id));
    this.api
      .get(id)
      .pipe(catchError(() => of(null)))
      .subscribe((ev) => {
        if (ev) this.details.update((m) => new Map(m).set(id, ev));
        this.detailLoading.update((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      });
  }

  /* ---- Toni / etichette esito -------------------------------------- */
  esitoTone(e: EventoSummary): 'success' | 'warning' | 'danger' | 'muted' {
    return ESITO_EVENTO_COLOR[e.esito] ?? 'muted';
  }
  esitoLabelKey(e: EventoSummary): string {
    return ESITO_EVENTO_LABEL[e.esito] ?? 'GiornaleEventi.Esiti.Ok';
  }
  dotColor(e: EventoSummary): string {
    return `var(--status-${this.esitoTone(e)}-text)`;
  }

  /** Titolo del nodo: tipo evento (label i18n se nota, altrimenti raw). */
  titolo(e: EventoSummary): string {
    const key = `GiornaleEventi.Tipi.${e.componente}.${e.tipoEvento}`;
    const t = this.translate.instant(key);
    return t && t !== key ? t : e.tipoEvento || '—';
  }

  /** Sottotitolo: data + durata. */
  sottotitolo(e: EventoSummary): string {
    const parts = [formatDateTime(e.dataEvento)];
    if (e.durataEventoMs != null) parts.push(`${e.durataEventoMs} ms`);
    return parts.join(' · ');
  }

  private translateOrRaw(key: string, raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const t = this.translate.instant(key);
    return t && t !== key ? t : raw;
  }

  /** Campi dell'espansione (riusa la mappatura del dettaglio evento). */
  campi(e: EventoSummary): InfoGridItem[] {
    return [
      {
        labelKey: 'GiornaleEventi.Detail.Categoria',
        value: e.categoriaEvento ? this.translate.instant(CATEGORIA_EVENTO_LABEL[e.categoriaEvento]) : undefined,
        hide: !e.categoriaEvento,
      },
      {
        labelKey: 'GiornaleEventi.Detail.Componente',
        value: this.translateOrRaw(`GiornaleEventi.Componenti.${e.componente}`, e.componente),
        hide: !e.componente,
      },
      { labelKey: 'GiornaleEventi.Detail.Sottotipo', value: e.sottotipoEvento, hide: !e.sottotipoEvento },
      { labelKey: 'GiornaleEventi.Detail.SottotipoEsito', value: e.sottotipoEsito, mono: true, hide: !e.sottotipoEsito },
      { labelKey: 'GiornaleEventi.Detail.TransactionId', value: e.transactionId, mono: true, hide: !e.transactionId },
      { labelKey: 'GiornaleEventi.Detail.DettaglioEsito', value: e.dettaglioEsito, wide: true, hide: !e.dettaglioEsito },
    ];
  }

  hasRichiesta(id: number): boolean {
    return !!this.details().get(id)?._links?.richiesta;
  }
  hasRisposta(id: number): boolean {
    return !!this.details().get(id)?._links?.risposta;
  }
  dimRichiesta(id: number): number | undefined {
    return this.details().get(id)?.dimensioneRichiesta;
  }
  dimRisposta(id: number): number | undefined {
    return this.details().get(id)?.dimensioneRisposta;
  }

  /* ---- Download messaggi HTTP (header + payload) come .txt ---------- */
  onDownloadRichiesta(id: number): void {
    this.download(id, 'richiesta');
  }
  onDownloadRisposta(id: number): void {
    this.download(id, 'risposta');
  }

  private download(id: number, kind: 'richiesta' | 'risposta'): void {
    const key = `${id}:${kind}`;
    if (this.downloading()) return;
    this.downloading.set(key);
    const source = kind === 'richiesta' ? this.api.getRichiesta(id) : this.api.getRisposta(id);
    source
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of(null);
        }),
      )
      .subscribe((msg) => {
        this.downloading.set(null);
        if (!msg) return;
        const txt = this.toTxt(msg.headers, msg.payload);
        downloadBlob(new Blob([txt], { type: 'text/plain' }), `${kind}-${id}.txt`);
      });
  }

  private toTxt(headers: EventoHeader[], payload: string | undefined): string {
    const h = (headers ?? []).map((x) => `${x.nome}: ${x.valore}`).join('\n');
    return payload ? `${h}\n\n${payload}` : h;
  }

  /** Dimensione leggibile (KB) per l'etichetta del pulsante. */
  formatDim(bytes: number | undefined): string {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
}
