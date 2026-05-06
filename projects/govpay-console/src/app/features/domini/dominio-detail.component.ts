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
  type InfoGridItem,
} from '@shared';
import { DominiApi } from './domini.api';
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
export class DominioDetailComponent implements OnInit {
  private readonly api = inject(DominiApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly dominio = signal<Dominio | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly abilitatoTone = computed(() => (this.dominio()?.abilitato ? 'success' : 'muted'));
  readonly abilitatoLabelKey = computed(() => (this.dominio()?.abilitato ? 'Common.Yes' : 'Common.No'));

  readonly anagraficaItems = computed<InfoGridItem[]>(() => {
    const d = this.dominio();
    if (!d) return [];
    return [
      { labelKey: 'Domini.Detail.IdDominio', value: d.idDominio, mono: true },
      { labelKey: 'Domini.Detail.RagioneSociale', value: d.ragioneSociale, wide: true },
      { labelKey: 'Domini.Detail.Area', value: d.area, hide: !d.area },
      { labelKey: 'Domini.Detail.Gln', value: d.gln, mono: true, hide: !d.gln },
      { labelKey: 'Domini.Detail.Cbill', value: d.cbill, mono: true, hide: !d.cbill },
    ];
  });

  readonly contattiItems = computed<InfoGridItem[]>(() => {
    const d = this.dominio();
    if (!d) return [];
    const indirizzo = [d.indirizzo, d.civico].filter(Boolean).join(' ');
    const localita = [d.cap, d.localita, d.provincia ? `(${d.provincia})` : '', d.nazione]
      .filter(Boolean)
      .join(' ');
    return [
      { labelKey: 'Domini.Detail.Indirizzo', value: indirizzo || undefined, hide: !indirizzo, wide: true },
      { labelKey: 'Domini.Detail.Localita', value: localita || undefined, hide: !localita, wide: true },
      { labelKey: 'Domini.Detail.Email', value: d.email, hide: !d.email },
      { labelKey: 'Domini.Detail.Pec', value: d.pec, hide: !d.pec },
      { labelKey: 'Domini.Detail.Tel', value: d.tel, hide: !d.tel },
      { labelKey: 'Domini.Detail.Fax', value: d.fax, hide: !d.fax },
      { labelKey: 'Domini.Detail.Web', value: d.web, hide: !d.web, wide: true },
    ];
  });

  readonly pagopaItems = computed<InfoGridItem[]>(() => {
    const d = this.dominio();
    if (!d) return [];
    return [
      { labelKey: 'Domini.Detail.Stazione', value: d.stazione, mono: true, hide: !d.stazione },
      { labelKey: 'Domini.Detail.AuxDigit', value: d.auxDigit, mono: true, hide: !d.auxDigit },
      { labelKey: 'Domini.Detail.SegregationCode', value: d.segregationCode, mono: true, hide: !d.segregationCode },
      { labelKey: 'Domini.Detail.IuvPrefix', value: d.iuvPrefix, mono: true, hide: !d.iuvPrefix },
      { labelKey: 'Domini.Detail.AutStampa', value: d.autStampaPosteItaliane, hide: !d.autStampaPosteItaliane, wide: true },
    ];
  });

  ngOnInit(): void {
    const idDominio = this.route.snapshot.paramMap.get('idDominio');
    if (!idDominio) {
      this.router.navigate(['/domini']);
      return;
    }
    this.system.setBreadcrumbs([
      { label: 'Nav.Domini', url: '/domini' },
      { label: idDominio },
    ]);
    this.fetch(idDominio);
  }

  private fetch(idDominio: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(idDominio)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
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
}
