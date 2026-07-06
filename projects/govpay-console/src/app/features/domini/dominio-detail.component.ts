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
import { UnitaOperativaInlineComponent } from './unita-operativa-inline.component';
import { ContoAccreditoInlineComponent } from './conto-accredito-inline.component';
import type { ContoAccreditoSummary, Dominio, UnitaOperativaSummary } from './dominio.model';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dominio-detail.component.html',
})
export class DominioDetailComponent implements OnInit, OnDestroy {
  private readonly api = inject(DominiConsoleApi);
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

  readonly activeTab = signal<'dati' | 'unitaOperative' | 'contiAccredito'>('dati');
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
  ]);

  /* ---- Unità operative (lazy) + creazione inline ---- */
  readonly unitaOperative = signal<UnitaOperativaSummary[] | null>(null);
  readonly uoLoading = signal(false);
  readonly showCreateUo = signal(false);

  /* ---- Conti di accredito (lazy) + creazione inline ---- */
  readonly contiAccredito = signal<ContoAccreditoSummary[] | null>(null);
  readonly contiLoading = signal(false);
  readonly showCreateConto = signal(false);

  /** Carica lazily le sotto-risorse all'apertura del relativo tab. */
  private readonly _tabLoader = effect(() => {
    if (!this.dominio()) return;
    if (this.activeTab() === 'unitaOperative' && this.unitaOperative() === null && !this.uoLoading()) {
      this.fetchUnitaOperative();
    }
    if (this.activeTab() === 'contiAccredito' && this.contiAccredito() === null && !this.contiLoading()) {
      this.fetchContiAccredito();
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
}
