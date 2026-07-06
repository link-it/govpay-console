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

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  InfoGridComponent,
  LoadingComponent,
  ListStickyToolbarDirective,
  PageHeaderComponent,
  StatusBadgeComponent,
  TabsComponent,
  type InfoGridItem,
  type TabDef,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { DominiConsoleApi } from './domini.console-api';
import { EntrateConsoleApi } from '@feature/entrate/entrate.console-api';
import { TipiPendenzaConsoleApi } from '@feature/tipi-pendenza/tipi-pendenza.console-api';
import { UnitaOperativaInlineComponent } from './unita-operativa-inline.component';
import { ContoAccreditoInlineComponent } from './conto-accredito-inline.component';
import { EntrataDominioInlineComponent } from './entrata-dominio-inline.component';
import { TipoPendenzaDominioInlineComponent } from './tipo-pendenza-dominio-inline.component';
import { ConnettoreDominioInlineComponent } from './connettore-dominio-inline.component';
import { CONNETTORI_DOMINIO } from './connettore-dominio.model';
import type { ContoAccreditoSummary, Dominio, EntrataDominioSummary, TipoPendenzaDominioSummary, UnitaOperativaSummary } from './dominio.model';

@Component({
  selector: 'lnk-dominio-detail',
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
    UnitaOperativaInlineComponent,
    ContoAccreditoInlineComponent,
    EntrataDominioInlineComponent,
    TipoPendenzaDominioInlineComponent,
    ConnettoreDominioInlineComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dominio-detail.component.html',
})
export class DominioDetailComponent implements OnInit, OnDestroy {
  private readonly api = inject(DominiConsoleApi);
  private readonly entrateApi = inject(EntrateConsoleApi);
  private readonly tipiApi = inject(TipiPendenzaConsoleApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  idDominio = '';

  readonly dominio = signal<Dominio | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Object URL del logo (null se assente). */
  readonly logoUrl = signal<string | null>(null);
  readonly logoBusy = signal(false);

  readonly connettori = CONNETTORI_DOMINIO;

  readonly activeTab = signal<'dati' | 'unitaOperative' | 'contiAccredito' | 'entrate' | 'tipiPendenza' | 'connettori'>('dati');
  readonly tabs = computed<TabDef[]>(() => [
    { id: 'dati', labelKey: 'Domini.Detail.TabDati' },
    {
      id: 'unitaOperative',
      labelKey: 'Domini.Detail.TabUnitaOperative',
      badge: this.unitaOperative() !== null ? this.unitaOperative()!.length : null,
      badgeLoading: this.uoLoading() && this.unitaOperative() === null,
    },
    {
      id: 'contiAccredito',
      labelKey: 'Domini.Detail.TabContiAccredito',
      badge: this.contiAccredito() !== null ? this.contiAccredito()!.length : null,
      badgeLoading: this.contiLoading() && this.contiAccredito() === null,
    },
    {
      id: 'entrate',
      labelKey: 'Domini.Detail.TabEntrate',
      badge: this.entrate() !== null ? this.entrate()!.length : null,
      badgeLoading: this.entrateLoading() && this.entrate() === null,
    },
    {
      id: 'tipiPendenza',
      labelKey: 'Domini.Detail.TabTipiPendenza',
      badge: this.tipiPendenza() !== null ? this.tipiPendenza()!.length : null,
      badgeLoading: this.tipiLoading() && this.tipiPendenza() === null,
    },
    { id: 'connettori', labelKey: 'Domini.Detail.TabConnettori' },
  ]);

  /* ---- Unità operative (lazy) + creazione inline ---- */
  readonly unitaOperative = signal<UnitaOperativaSummary[] | null>(null);
  readonly uoLoading = signal(false);
  readonly showCreateUo = signal(false);

  /* ---- Conti di accredito (lazy) + creazione inline ---- */
  readonly contiAccredito = signal<ContoAccreditoSummary[] | null>(null);
  readonly contiLoading = signal(false);
  readonly showCreateConto = signal(false);

  /* ---- Entrate del dominio (lazy) + creazione inline ---- */
  readonly entrate = signal<EntrataDominioSummary[] | null>(null);
  readonly entrateLoading = signal(false);
  readonly showCreateEntrata = signal(false);
  readonly entrateSuggestions = signal<{ id: string; label?: string }[]>([]);
  readonly ibanSuggestions = signal<string[]>([]);

  /* ---- Tipi pendenza del dominio (lazy) + creazione inline ---- */
  readonly tipiPendenza = signal<TipoPendenzaDominioSummary[] | null>(null);
  readonly tipiLoading = signal(false);
  readonly showCreateTipo = signal(false);
  readonly tipiSuggestions = signal<{ id: string; label?: string }[]>([]);

  /** Carica lazily le sotto-risorse all'apertura del relativo tab. */
  private readonly _tabLoader = effect(() => {
    if (!this.dominio()) return;
    if (this.activeTab() === 'unitaOperative' && this.unitaOperative() === null && !this.uoLoading()) {
      this.fetchUnitaOperative();
    }
    if (this.activeTab() === 'contiAccredito' && this.contiAccredito() === null && !this.contiLoading()) {
      this.fetchContiAccredito();
    }
    if (this.activeTab() === 'entrate' && this.entrate() === null && !this.entrateLoading()) {
      this.fetchEntrate();
      this.loadEntrateSuggestions();
    }
    if (this.activeTab() === 'tipiPendenza' && this.tipiPendenza() === null && !this.tipiLoading()) {
      this.fetchTipiPendenza();
      this.loadTipiSuggestions();
    }
  });

  readonly abilitatoTone = computed(() => (this.dominio()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.dominio()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly generaliItems = computed<InfoGridItem[]>(() => {
    const d = this.dominio();
    if (!d) return [];
    const items: InfoGridItem[] = [
      { labelKey: 'Domini.Detail.IdDominio', value: d.idDominio, mono: true },
      { labelKey: 'Domini.Detail.RagioneSociale', value: d.ragioneSociale, wide: true },
      { labelKey: 'Domini.Detail.Gln', value: d.gln, mono: true, hide: !d.gln },
      { labelKey: 'Domini.Detail.IdStazione', value: d.idStazione, mono: true, hide: !d.idStazione },
      { labelKey: 'Domini.Detail.Intermediario', value: d.riferimentoIntermediario?.idIntermediario, mono: true, hide: !d.riferimentoIntermediario },
      { labelKey: 'Domini.Detail.Intermediato', value: this.translate.instant(d.intermediato ? 'Common.Yes' : 'Common.No') },
      { labelKey: 'Domini.Detail.ScaricaFr', value: this.translate.instant(d.scaricaFr ? 'Common.Yes' : 'Common.No') },
      { labelKey: 'Domini.Detail.AuxDigit', value: d.auxDigit != null ? String(d.auxDigit) : undefined, hide: d.auxDigit == null },
      { labelKey: 'Domini.Detail.SegregationCode', value: d.segregationCode != null ? String(d.segregationCode) : undefined, hide: d.segregationCode == null },
      { labelKey: 'Domini.Detail.Localita', value: d.localita, hide: !d.localita },
    ];
    return items;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idDominio');
    if (!id) {
      this.router.navigate(['/domini']);
      return;
    }
    this.idDominio = id;
    this.system.setBreadcrumbs([{ label: 'Nav.Domini', url: '/domini' }, { label: id }]);
    this.fetch();
    this.loadLogo();
  }

  ngOnDestroy(): void {
    this.revokeLogo();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(this.idDominio)
      .pipe(
        catchError((err) => {
          const msg = problemDetail(err, this.translate.instant('Common.LoadError'));
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((d) => {
        this.dominio.set(d);
        this.loading.set(false);
      });
  }

  private loadLogo(): void {
    this.api
      .getLogo(this.idDominio)
      .pipe(catchError(() => of(null)))
      .subscribe((blob) => {
        this.revokeLogo();
        this.logoUrl.set(blob && blob.size > 0 ? URL.createObjectURL(blob) : null);
      });
  }

  private revokeLogo(): void {
    const url = this.logoUrl();
    if (url) URL.revokeObjectURL(url);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 256 * 1024) {
      this.snackbar.error(this.translate.instant('Domini.Logo.TroppoGrande'));
      return;
    }
    this.logoBusy.set(true);
    this.api
      .putLogo(this.idDominio, file)
      .pipe(catchError((err) => {
        this.snackbar.error(problemDetail(err, this.translate.instant('Domini.Logo.Errore')));
        return of(null);
      }))
      .subscribe((res) => {
        this.logoBusy.set(false);
        if (res === null) return;
        this.snackbar.success(this.translate.instant('Domini.Logo.Aggiornato'));
        this.loadLogo();
      });
  }

  removeLogo(): void {
    this.logoBusy.set(true);
    this.api
      .deleteLogo(this.idDominio)
      .pipe(catchError((err) => {
        this.snackbar.error(problemDetail(err, this.translate.instant('Domini.Logo.Errore')));
        return of(null);
      }))
      .subscribe((res) => {
        this.logoBusy.set(false);
        if (res === null) return;
        this.snackbar.success(this.translate.instant('Domini.Logo.Rimosso'));
        this.loadLogo();
      });
  }

  /* ---- Unità operative ---- */

  private fetchUnitaOperative(): void {
    this.uoLoading.set(true);
    this.api
      .listUnitaOperative(this.idDominio, { limit: 200 })
      .pipe(catchError(() => of({ results: [] as UnitaOperativaSummary[] })))
      .subscribe((slice) => {
        this.unitaOperative.set(slice.results ?? []);
        this.uoLoading.set(false);
      });
  }

  onUnitaOperativaSaved(): void {
    this.showCreateUo.set(false);
    this.fetchUnitaOperative();
  }

  /* ---- Conti di accredito ---- */

  private fetchContiAccredito(): void {
    this.contiLoading.set(true);
    this.api
      .listContiAccredito(this.idDominio, { limit: 200 })
      .pipe(catchError(() => of({ results: [] as ContoAccreditoSummary[] })))
      .subscribe((slice) => {
        this.contiAccredito.set(slice.results ?? []);
        this.contiLoading.set(false);
      });
  }

  onContoAccreditoSaved(): void {
    this.showCreateConto.set(false);
    this.fetchContiAccredito();
  }

  /* ---- Entrate del dominio ---- */

  private fetchEntrate(): void {
    this.entrateLoading.set(true);
    this.api
      .listEntrate(this.idDominio, { limit: 200 })
      .pipe(catchError(() => of({ results: [] as EntrataDominioSummary[] })))
      .subscribe((slice) => {
        this.entrate.set(slice.results ?? []);
        this.entrateLoading.set(false);
      });
  }

  /** Suggerimenti per la creazione: entrate globali + IBAN dei conti del dominio. */
  private loadEntrateSuggestions(): void {
    if (this.entrateSuggestions().length === 0) {
      this.entrateApi
        .list({ limit: 200 })
        .pipe(catchError(() => of({ results: [] })))
        .subscribe((slice) => {
          this.entrateSuggestions.set((slice.results ?? []).map((e) => ({ id: e.idEntrata, label: e.descrizione })));
        });
    }
    if (this.ibanSuggestions().length === 0) {
      this.api
        .listContiAccredito(this.idDominio, { limit: 200 })
        .pipe(catchError(() => of({ results: [] as ContoAccreditoSummary[] })))
        .subscribe((slice) => {
          this.ibanSuggestions.set((slice.results ?? []).map((c) => c.ibanAccredito));
        });
    }
  }

  onEntrataSaved(): void {
    this.showCreateEntrata.set(false);
    this.fetchEntrate();
  }

  /* ---- Tipi pendenza del dominio ---- */

  private fetchTipiPendenza(): void {
    this.tipiLoading.set(true);
    this.api
      .listTipiPendenza(this.idDominio, { limit: 200 })
      .pipe(catchError(() => of({ results: [] as TipoPendenzaDominioSummary[] })))
      .subscribe((slice) => {
        this.tipiPendenza.set(slice.results ?? []);
        this.tipiLoading.set(false);
      });
  }

  private loadTipiSuggestions(): void {
    if (this.tipiSuggestions().length > 0) return;
    this.tipiApi
      .list({ limit: 200 })
      .pipe(catchError(() => of({ results: [] })))
      .subscribe((slice) => {
        this.tipiSuggestions.set((slice.results ?? []).map((t) => ({ id: t.idTipoPendenza, label: t.descrizione })));
      });
  }

  onTipoPendenzaSaved(): void {
    this.showCreateTipo.set(false);
    this.fetchTipiPendenza();
  }
}
