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

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
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
  type InfoGridItem,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { DominiConsoleApi } from './domini.console-api';
import type { Dominio } from './dominio.model';

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
}
