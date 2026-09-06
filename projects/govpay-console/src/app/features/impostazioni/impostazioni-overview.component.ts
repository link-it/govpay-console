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
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade, SnackbarService, PageHeaderComponent, ListStickyToolbarDirective, formatDateTime } from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import { AREE_IMPOSTAZIONI, type AreaImpostazioniDef } from './impostazioni.aree';

/** Card dell'overview: definizione statica + metadati (abilitata/ultimaModifica) dall'API. */
interface AreaCard extends AreaImpostazioniDef {
  abilitata?: boolean;
  ultimaModifica?: string;
}

@Component({
  selector: 'lnk-impostazioni-overview',
  standalone: true,
  imports: [RouterLink, NgIcon, TranslatePipe, PageHeaderComponent, ListStickyToolbarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './impostazioni-overview.component.html',
})
export class ImpostazioniOverviewComponent implements OnInit {
  private readonly api = inject(ImpostazioniConsoleApi);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  /** Metadati per codice area dall'overview API. */
  private readonly meta = signal<Record<string, { abilitata?: boolean; ultimaModifica?: string }>>({});

  readonly cards = computed<AreaCard[]>(() =>
    AREE_IMPOSTAZIONI.map((a) => ({ ...a, ...(this.meta()[a.codice] ?? {}) }))
  );

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Impostazioni' }]);
    this.loading.set(true);
    this.api
      .overview()
      .pipe(
        catchError((err) => {
          // L'overview è supplementare (badge): un errore non blocca la navigazione.
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of({ aree: [] });
        })
      )
      .subscribe((ov) => {
        const map: Record<string, { abilitata?: boolean; ultimaModifica?: string }> = {};
        for (const a of ov.aree ?? []) map[a.codice] = { abilitata: a.abilitata, ultimaModifica: a.ultimaModifica };
        this.meta.set(map);
        this.loading.set(false);
      });
  }

  formatData(iso?: string): string {
    return iso ? formatDateTime(iso) : '';
  }
}
