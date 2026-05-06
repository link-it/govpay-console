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
import { catchError, of } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@core/system';
import { SnackbarService } from '@core/ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  LoadingComponent,
  PageHeaderComponent,
} from '@shared';
import { ImpostazioniApi, type Configurazione } from './impostazioni.api';

@Component({
  selector: 'lnk-impostazioni',
  standalone: true,
  imports: [
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './impostazioni.component.html',
})
export class ImpostazioniComponent implements OnInit {
  private readonly api = inject(ImpostazioniApi);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly config = signal<Configurazione | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly sezioni = computed<Array<{ key: string; value: unknown }>>(() => {
    const c = this.config();
    if (!c) return [];
    return Object.entries(c).map(([key, value]) => ({ key, value }));
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Impostazioni' }]);
    this.fetch();
  }

  refresh(): void { this.fetch(); }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get()
      .pipe(
        catchError((err) => {
          const msg = err?.error?.descrizione ?? this.translate.instant('Common.LoadError');
          this.error.set(msg);
          this.snackbar.error(msg);
          return of(null);
        })
      )
      .subscribe((c) => {
        this.config.set(c);
        this.loading.set(false);
      });
  }
}
