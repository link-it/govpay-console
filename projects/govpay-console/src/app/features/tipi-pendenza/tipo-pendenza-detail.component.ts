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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  TabsComponent,
  type InfoGridItem,
  type TabDef,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { decodeBase64 } from '@core/utils/base64';
import { TipiPendenzaConsoleApi } from './tipi-pendenza.console-api';
import type { TipoPendenza, TipoPendenzaAvvisatura, TipoPendenzaPortale, TipoPendenzaPromemoria } from './tipo-pendenza.model';

/** Descrittore di un promemoria per il rendering strutturato. */
interface PromemoriaView {
  titleKey: string;
  p: TipoPendenzaPromemoria;
  allegaPdf: boolean;
  soloEseguiti: boolean;
  preavviso: boolean;
}

@Component({
  selector: 'lnk-tipo-pendenza-detail',
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
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipo-pendenza-detail.component.html',
})
export class TipoPendenzaDetailComponent implements OnInit {
  private readonly api = inject(TipiPendenzaConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idTipoPendenza = '';

  readonly tipo = signal<TipoPendenza | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeTab = signal<'dati' | 'backoffice' | 'pagamento' | 'avvMail' | 'avvAppIO' | 'altre'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati', labelKey: 'TipiPendenza.Form.TabDati' },
    { id: 'backoffice', labelKey: 'TipiPendenza.Form.TabPortaleBackoffice' },
    { id: 'pagamento', labelKey: 'TipiPendenza.Form.TabPortalePagamento' },
    { id: 'avvMail', labelKey: 'TipiPendenza.Form.TabAvvisaturaMail' },
    { id: 'avvAppIO', labelKey: 'TipiPendenza.Form.TabAvvisaturaAppIO' },
    { id: 'altre', labelKey: 'TipiPendenza.Form.TabAltre' },
  ]);

  readonly abilitatoTone = computed(() => (this.tipo()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.tipo()?.abilitato ? 'Common.Yes' : 'Common.No'));

  private yn(b: boolean | undefined): string {
    return this.translate.instant(b ? 'Common.Yes' : 'Common.No');
  }

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const t = this.tipo();
    if (!t) return [];
    return [
      { labelKey: 'TipiPendenza.Detail.IdTipoPendenza', value: t.idTipoPendenza, mono: true },
      { labelKey: 'TipiPendenza.Detail.Descrizione', value: t.descrizione, wide: true },
      { labelKey: 'TipiPendenza.Detail.CodificaIUV', value: t.codificaIUV, mono: true, hide: !t.codificaIUV },
      { labelKey: 'TipiPendenza.Detail.PagaTerzi', value: this.yn(t.pagaTerzi) },
    ];
  });

  private portaleItems(p: TipoPendenzaPortale | undefined): InfoGridItem[] {
    if (!p) return [];
    return [
      { labelKey: 'TipiPendenza.Config.Abilitato', value: this.yn(p.abilitato) },
      { labelKey: 'TipiPendenza.Config.TipoLayout', value: p.form?.tipo, hide: !p.form?.tipo, mono: true },
      { labelKey: 'TipiPendenza.Config.TipoTemplate', value: p.trasformazione?.tipo, hide: !p.trasformazione?.tipo },
      { labelKey: 'TipiPendenza.Config.Inoltro', value: p.inoltro, hide: !p.inoltro, mono: true },
    ];
  }

  readonly backofficeItems = computed(() => this.portaleItems(this.tipo()?.portaleBackoffice));
  readonly pagamentoItems = computed(() => this.portaleItems(this.tipo()?.portalePagamento));

  readonly tracciatoItems = computed<InfoGridItem[]>(() => {
    const tc = this.tipo()?.tracciatoCsv;
    if (!tc) return [];
    return [
      { labelKey: 'TipiPendenza.Config.TipoTemplate', value: tc.tipo, hide: !tc.tipo },
      { labelKey: 'TipiPendenza.Config.Intestazione', value: tc.intestazione, wide: true, hide: !tc.intestazione },
    ];
  });

  readonly mailPromemoria = computed(() => this.promemoriaList(this.tipo()?.avvisaturaMail, true));
  readonly appIoPromemoria = computed(() => this.promemoriaList(this.tipo()?.avvisaturaAppIO, false));

  private promemoriaList(a: TipoPendenzaAvvisatura | undefined, mail: boolean): PromemoriaView[] {
    if (!a) return [];
    const rows: PromemoriaView[] = [
      { titleKey: 'TipiPendenza.Config.PromemoriaAvviso', p: a.promemoriaAvviso!, allegaPdf: mail, soloEseguiti: false, preavviso: false },
      { titleKey: 'TipiPendenza.Config.PromemoriaScadenza', p: a.promemoriaScadenza!, allegaPdf: false, soloEseguiti: false, preavviso: true },
      { titleKey: 'TipiPendenza.Config.PromemoriaRicevuta', p: a.promemoriaRicevuta!, allegaPdf: mail, soloEseguiti: true, preavviso: false },
    ];
    return rows.filter((r) => !!r.p);
  }

  /** Righe info-grid per un promemoria (usato dal template). */
  promemoriaItems(pr: PromemoriaView): InfoGridItem[] {
    const p = pr.p;
    const items: InfoGridItem[] = [{ labelKey: 'TipiPendenza.Config.Abilitato', value: this.yn(p.abilitato) }];
    if (pr.preavviso) items.push({ labelKey: 'TipiPendenza.Config.Preavviso', value: p.preavviso != null ? String(p.preavviso) : undefined, hide: p.preavviso == null });
    items.push({ labelKey: 'TipiPendenza.Config.TipoTemplate', value: p.tipo, hide: !p.tipo });
    if (pr.allegaPdf) items.push({ labelKey: 'TipiPendenza.Config.AllegaPdf', value: this.yn(p.allegaPdf) });
    if (pr.soloEseguiti) items.push({ labelKey: 'TipiPendenza.Config.SoloEseguiti', value: this.yn(p.soloEseguiti) });
    return items;
  }

  /** True se la sezione ha almeno un contenuto (per il messaggio "non configurato"). */
  readonly hasBackoffice = computed(() => !!this.tipo()?.portaleBackoffice);
  readonly hasPagamento = computed(() => !!this.tipo()?.portalePagamento);
  readonly hasAvvMail = computed(() => this.mailPromemoria().length > 0);
  readonly hasAvvAppIO = computed(() => this.appIoPromemoria().length > 0);
  readonly hasAltre = computed(() => !!this.tipo()?.tracciatoCsv || !!this.tipo()?.visualizzazione);

  /**
   * Rende leggibile un blocco config (read-only). Il valore è memorizzato come
   * stringa base64: viene decodificato e, se è JSON, indentato; i template
   * freemarker restano grezzi.
   */
  formatJson(payload: unknown): string {
    if (payload == null || payload === '') return '';
    let text = typeof payload === 'string' ? decodeBase64(payload) : JSON.stringify(payload, null, 2);
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* contenuto non-JSON (es. freemarker): mostrato grezzo */
    }
    return text;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idTipoPendenza');
    if (!id) {
      this.router.navigate(['/tipi-pendenza']);
      return;
    }
    this.idTipoPendenza = id;
    this.system.setBreadcrumbs([{ label: 'Nav.TipiPendenza', url: '/tipi-pendenza' }, { label: id }]);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idTipoPendenza)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((t) => {
        this.tipo.set(t);
        this.loading.set(false);
      });
  }
}
