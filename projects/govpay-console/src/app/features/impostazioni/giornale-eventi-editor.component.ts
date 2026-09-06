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

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, type Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade, SelectComponent, type LnkSelectOption } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  FormActionBarComponent,
  LoadingComponent,
  PageHeaderComponent,
  ListStickyToolbarDirective,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import {
  GDE_INTERFACCE,
  type GdePolitica,
  type ImpostazioniGiornaleEventi,
} from './impostazioni.model';

type Lato = 'letture' | 'scritture';
type Campo = 'log' | 'dump';
const POLITICHE: GdePolitica[] = ['SEMPRE', 'SOLO_ERRORE', 'MAI'];

/**
 * Editor **Impostazioni → Giornale eventi** (politica di logging GDE). Matrice
 * 8 interfacce × {letture, scritture} × {log, dump}. GET+ETag → PUT-replace con
 * If-Match. Stato signal-based (niente maxi form reattivo).
 */
@Component({
  selector: 'lnk-giornale-eventi-editor',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NgIcon,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
    FormActionBarComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './giornale-eventi-editor.component.html',
})
export class GiornaleEventiEditorComponent implements OnInit {
  private readonly api = inject(ImpostazioniConsoleApi);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private etag: string | null = null;
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly stato = signal<ImpostazioniGiornaleEventi | null>(null);
  readonly interfacce = GDE_INTERFACCE;
  readonly politicheOptions: LnkSelectOption[] = POLITICHE.map((p) => ({
    value: p,
    label: this.translate.instant(`Impostazioni.GiornaleEventi.Politiche.${p}`),
  }));

  ngOnInit(): void {
    this.system.setBreadcrumbs([
      { label: 'Nav.Impostazioni', url: '/impostazioni' },
      { label: 'Impostazioni.Aree.GiornaleEventi.Nome' },
    ]);
    this.loading.set(true);
    this.api
      .getGiornaleEventi()
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          this.router.navigate(['/impostazioni']);
          return of(null);
        })
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res?.body) return;
        this.etag = res.etag;
        this.stato.set(res.body);
      });
  }

  /** Valore corrente di una cella della matrice. */
  valore(iface: keyof ImpostazioniGiornaleEventi, lato: Lato, campo: Campo): GdePolitica | '' {
    return this.stato()?.[iface]?.[lato]?.[campo] ?? '';
  }

  /** Aggiorna immutabilmente una cella (valore dal `lnk-select`). */
  setValore(iface: keyof ImpostazioniGiornaleEventi, lato: Lato, campo: Campo, value: string): void {
    this.stato.update((s) => {
      if (!s) return s;
      const intf = s[iface];
      return {
        ...s,
        [iface]: {
          ...intf,
          [lato]: { ...intf[lato], [campo]: value as GdePolitica },
        },
      };
    });
  }

  ifaceLabel(iface: string): string {
    return this.translate.instant(`Impostazioni.GiornaleEventi.Interfacce.${iface}`);
  }

  save(): void {
    const body = this.stato();
    if (!body || this.saving()) return;
    this.saving.set(true);
    this.api
      .putGiornaleEventi(body, this.etag)
      .pipe(catchError((err) => this.onError(err)))
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        if (res.body) this.stato.set(res.body);
        this.snackbar.success(this.translate.instant('Impostazioni.Salvato'));
      });
  }

  private onError(err: HttpErrorResponse): Observable<null> {
    this.saving.set(false);
    const key = err.status === 412 || err.status === 428 ? 'Impostazioni.ConflittoConcorrenza'
      : err.status === 422 ? 'Impostazioni.Invalido'
      : 'Impostazioni.SalvaErrore';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
